# 🔍 AUDIT SISTEM KOMISI REFERRAL

**Status:** ⚠️ **BELUM TERINTEGRASI DENGAN TOPUP GAS FEE**  
**Tanggal Audit:** November 2, 2025

---

## 📋 EXECUTIVE SUMMARY

Sistem komisi referral **SUDAH DIBANGUN** tetapi **BELUM TERINTEGRASI** dengan sistem topup gas fee balance. Komisi referral saat ini hanya akan aktif jika user melakukan trading/deposit fee, bukan dari topup gas fee balance.

---

## 🏗️ ARSITEKTUR SISTEM SAAT INI

### 1. **Gas Fee Balance System**
**File:** `/src/app/api/user/balance/route.ts`

```typescript
// GET - Get user's gas fee balance
user.gasFeeBalance  // Balance untuk gas fee

// POST - Update gas fee balance (for top-up)
user.gasFeeBalance = (user.gasFeeBalance || 0) + amount;
await user.save();
```

**Masalah:** ❌ **Tidak ada trigger komisi referral saat topup**

### 2. **Referral Commission System** 
**File:** `/src/lib/referralCommission.ts`

```typescript
export async function calculateReferralCommission(input: CommissionInput) {
  // Input parameters:
  userId,           // User yang melakukan transaksi
  amount,          // Total fee amount
  source,          // 'trading_fee' | 'deposit_fee' | 'withdrawal_fee' | 'subscription'
  sourceTransactionId,
  notes
}
```

**Commission Rates by Membership:**
- Bronze: 10%
- Silver: 20%
- Gold: 30%
- Platinum: 50%

**Commission Distribution (3 Levels):**
- Level 1 (Direct): 50% dari commission
- Level 2 (Second): 30% dari commission
- Level 3 (Third): 20% dari commission

### 3. **Referral Stats API**
**File:** `/src/app/api/referral/stats/route.ts`

```typescript
// Data yang ditampilkan:
totalEarnings: user.totalEarnings || 0  // Total komisi yang sudah diperoleh
```

**Masalah:** ❌ **Available Commission = totalEarnings (tidak dikurangi withdrawal)**

---

## ⚠️ MASALAH YANG DITEMUKAN

### 1. **NO COMMISSION FROM GAS FEE TOPUP** (CRITICAL)
```typescript
// File: /src/app/api/user/balance/route.ts
// POST - Update gas fee balance

user.gasFeeBalance = (user.gasFeeBalance || 0) + amount;
await user.save();

// ❌ MISSING: Commission calculation tidak dipanggil!
// ❌ MISSING: await calculateReferralCommission({ ... });
```

**Impact:** User topup gas fee $100, referrer **TIDAK DAPAT KOMISI**.

### 2. **AVAILABLE COMMISSION TIDAK AKURAT**
```typescript
// File: /src/app/api/referral/stats/route.ts
totalEarnings: user.totalEarnings || 0

// ❌ PROBLEM: Tidak dikurangi withdrawal
// Seharusnya: totalEarnings - totalWithdrawn = availableCommission
```

**Impact:** User tidak tahu berapa saldo komisi yang bisa ditarik.

### 3. **COMMISSION SOURCE TERBATAS**
```typescript
// File: /src/lib/referralCommission.ts
source: 'trading_fee' | 'deposit_fee' | 'withdrawal_fee' | 'subscription'

// ❌ MISSING: 'gas_fee_topup'
```

**Impact:** Tidak ada kategori untuk komisi dari topup gas fee.

---

## ✅ SOLUSI YANG HARUS DIIMPLEMENTASIKAN

### **SOLUSI 1: Integrate Commission dengan Gas Fee Topup**

**File:** `/src/app/api/user/balance/route.ts`

```typescript
import { calculateReferralCommission } from '@/lib/referralCommission';

// POST - Update gas fee balance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { amount, source = 'topup' } = body; // tambahkan source

    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    // Update balance
    user.gasFeeBalance = (user.gasFeeBalance || 0) + amount;
    await user.save();

    // 🎯 CALCULATE REFERRAL COMMISSION
    // Anggap 5% dari topup adalah fee platform
    const platformFee = amount * 0.05; // 5% dari $100 = $5

    await calculateReferralCommission({
      userId: user._id,
      amount: platformFee,
      source: 'gas_fee_topup', // tambahkan tipe baru
      notes: `Gas fee topup commission: $${amount}`,
    });

    return NextResponse.json({
      message: 'Balance updated successfully',
      gasFeeBalance: user.gasFeeBalance,
    });
  } catch (error) {
    console.error('Error updating gas fee balance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### **SOLUSI 2: Update Commission Source Type**

**File:** `/src/lib/referralCommission.ts`

```typescript
interface CommissionInput {
  userId: mongoose.Types.ObjectId | string;
  amount: number;
  source: 'trading_fee' | 'deposit_fee' | 'withdrawal_fee' | 'subscription' | 'gas_fee_topup'; // ✅ Tambah
  sourceTransactionId?: mongoose.Types.ObjectId | string;
  notes?: string;
}
```

**File:** `/src/models/ReferralCommission.ts`

```typescript
source: {
  type: String,
  enum: ['trading_fee', 'deposit_fee', 'withdrawal_fee', 'subscription', 'gas_fee_topup'], // ✅ Tambah
  required: true,
},
```

### **SOLUSI 3: Fix Available Commission Calculation**

**File:** `/src/app/api/referral/stats/route.ts`

```typescript
import { Withdrawal } from '@/models/Withdrawal';

export async function GET(request: NextRequest) {
  try {
    const user = await User.findOne({ email: session.user.email });

    // Calculate total withdrawn
    const withdrawals = await Withdrawal.find({
      userId: user._id,
      type: 'referral',
      status: { $in: ['processing', 'completed'] }
    });
    
    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    
    // Calculate available commission
    const availableCommission = (user.totalEarnings || 0) - totalWithdrawn;

    const stats = {
      referralCode: user.referralCode || '',
      membershipLevel: user.membershipLevel || 'bronze',
      commissionRate,
      totalEarnings: user.totalEarnings || 0,
      totalWithdrawn: totalWithdrawn, // ✅ Tambah
      availableCommission: availableCommission, // ✅ Tambah
      totalReferrals: { ... },
      referrals: referralList,
    };

    return NextResponse.json(stats, { status: 200 });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
  }
}
```

### **SOLUSI 4: Update Frontend untuk Available Commission**

**File:** `/src/app/referral/page.tsx`

```typescript
interface ReferralStats {
  referralCode: string;
  membershipLevel: string;
  commissionRate: number;
  totalEarnings: number;
  totalWithdrawn: number; // ✅ Tambah
  availableCommission: number; // ✅ Tambah
  totalReferrals: { ... };
  referrals: [...];
}

// Available Commission Card
<p className="text-2xl sm:text-3xl font-bold text-white">
  ${stats.availableCommission.toFixed(2)} {/* ✅ Update */}
</p>
```

---

## 📊 CONTOH PERHITUNGAN

### Scenario: User A topup $100

**1. Platform Fee:**
```
Topup: $100
Platform Fee: $100 × 5% = $5
```

**2. Commission Distribution (User A = Gold Member, 30%):**
```
Base Commission: $5 × 30% = $1.50

Level 1 (Direct Referrer): $1.50 × 50% = $0.75
Level 2 (Second Level):     $1.50 × 30% = $0.45
Level 3 (Third Level):      $1.50 × 20% = $0.30

Total Commission Distributed: $1.50
```

**3. Database Updates:**
```typescript
// Level 1 Referrer (User B)
User B.totalEarnings += $0.75
ReferralCommission.create({
  userId: userB._id,
  referralUserId: userA._id,
  referralLevel: 1,
  amount: 0.75,
  source: 'gas_fee_topup',
  status: 'pending'
})

// Level 2 Referrer (User C)
User C.totalEarnings += $0.45
ReferralCommission.create({
  userId: userC._id,
  referralUserId: userA._id,
  referralLevel: 2,
  amount: 0.45,
  source: 'gas_fee_topup',
  status: 'pending'
})

// Level 3 Referrer (User D)
User D.totalEarnings += $0.30
ReferralCommission.create({
  userId: userD._id,
  referralUserId: userA._id,
  referralLevel: 3,
  amount: 0.30,
  source: 'gas_fee_topup',
  status: 'pending'
})
```

---

## 🎯 IMPLEMENTASI PRIORITY

### **HIGH PRIORITY (MUST HAVE):**
1. ✅ Integrate commission calculation ke topup gas fee balance
2. ✅ Fix available commission calculation (subtract withdrawals)
3. ✅ Update commission source type untuk 'gas_fee_topup'

### **MEDIUM PRIORITY (SHOULD HAVE):**
4. ✅ Create admin setting untuk platform fee percentage (default 5%)
5. ✅ Add transaction history untuk commission per source
6. ✅ Create cron job untuk auto-approve pending commissions

### **LOW PRIORITY (NICE TO HAVE):**
7. ✅ Email notification untuk referrer saat dapat komisi
8. ✅ Dashboard analytics untuk commission breakdown by source
9. ✅ Export commission report (CSV/PDF)

---

## 🔄 FLOW DIAGRAM

```
User A topup $100 gas fee
    ↓
POST /api/user/balance
    ↓
Update user.gasFeeBalance += $100
    ↓
Calculate Platform Fee ($5)
    ↓
calculateReferralCommission()
    ↓
Find User A's referral chain (Level 1, 2, 3)
    ↓
Calculate commission per level
    ↓
Update totalEarnings for each referrer
    ↓
Create ReferralCommission records
    ↓
Return success response
```

---

## ✅ TESTING CHECKLIST

### **Unit Tests:**
- [ ] Test commission calculation untuk Bronze/Silver/Gold/Platinum
- [ ] Test 3-level referral chain
- [ ] Test available commission calculation (earnings - withdrawals)
- [ ] Test platform fee percentage calculation

### **Integration Tests:**
- [ ] Test topup $100 → commission distributed correctly
- [ ] Test withdrawal → available commission decreases
- [ ] Test user without referrer → no commission created
- [ ] Test user with only 1 or 2 level referrer

### **E2E Tests:**
- [ ] User A registers dengan ref code dari User B
- [ ] User A topup $100
- [ ] Verify User B received correct commission
- [ ] Verify commission appears in User B's dashboard
- [ ] User B withdraw commission
- [ ] Verify available commission updated

---

## 📝 CONCLUSION

**Status Saat Ini:**
- ❌ Komisi referral **TIDAK AKTIF** untuk topup gas fee
- ❌ Available commission **TIDAK AKURAT** (tidak dikurangi withdrawal)
- ✅ Infrastructure untuk komisi **SUDAH ADA** (tinggal integrate)

**Action Required:**
1. Implementasi Solusi 1-4 di atas
2. Testing comprehensive
3. Deploy ke production
4. Monitor commission distribution

**Estimated Time:**
- Development: 4-6 hours
- Testing: 2-3 hours
- Documentation: 1 hour
- **Total: 1 working day**

---

**Next Steps:**
1. Review dan approve solusi ini
2. Implementasi code changes
3. Create test cases
4. Deploy ke mainnet
5. Monitor dan fix bugs
6. Deploy ke mainnet

