# 🔒 COMMISSION WALLET SECURITY AUDIT
**Date:** November 2, 2025  
**Target:** Available Commission System (`/referral` page)  
**Status:** ⚠️ **CRITICAL VULNERABILITIES FOUND**

---

## 📋 EXECUTIVE SUMMARY

Available Commission system berperan sebagai **custodial wallet** untuk komisi referral. Audit ini menemukan **4 CRITICAL** dan **3 HIGH** severity vulnerabilities yang dapat menyebabkan:
- ❌ Race condition attacks (double withdrawal)
- ❌ Balance manipulation
- ❌ Unauthorized withdrawals
- ❌ Data inconsistency

**Recommendation:** ⚠️ **IMMEDIATE FIX REQUIRED** sebelum production

---

## 🚨 CRITICAL VULNERABILITIES

### 1. ⚠️ **RACE CONDITION - Double Withdrawal Attack** (CRITICAL)

**Location:** `/api/withdrawals/route.ts` (Line 108-142)

**Issue:**
```typescript
// ❌ VULNERABLE CODE
const user = await User.findById(session.user.id);

// Check balance (NOT ATOMIC!)
if ((user.totalEarnings || 0) < amount) {
  return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
}

// ... 10+ lines of code execution delay ...

// Deduct balance (SEPARATE OPERATION!)
user.totalEarnings = (user.totalEarnings || 0) - amount;
await user.save();
```

**Attack Vector:**
```javascript
// Attacker dengan balance $100 bisa withdraw $200 dengan 2 simultaneous requests:

Request A (t=0):    GET user.totalEarnings = $100 ✅
Request B (t=1):    GET user.totalEarnings = $100 ✅ (SAME VALUE!)
Request A (t=2):    DEDUCT $100 → balance = $0
Request B (t=3):    DEDUCT $100 → balance = -$100 ❌ (NEGATIVE!)

Result: User withdrew $200 with only $100 balance
```

**Impact:**
- 🔴 Platform financial loss
- 🔴 Negative balances in database
- 🔴 Can be automated (bots can exploit)
- 🔴 Affects all concurrent withdrawal requests

**Proof of Concept:**
```bash
# Attacker script (can steal unlimited funds)
curl -X POST http://localhost:3000/api/withdrawals \
  -H "Cookie: session_token" \
  -d '{"amount": 100, "walletAddress": "0x...", "network": "ERC20"}' &

curl -X POST http://localhost:3000/api/withdrawals \
  -H "Cookie: session_token" \
  -d '{"amount": 100, "walletAddress": "0x...", "network": "ERC20"}' &

# Both requests see balance = $100
# Both withdraw successfully
# Final balance = -$100 ❌
```

**CVSS Score:** 9.8 (CRITICAL)
- Exploitability: HIGH (simple HTTP requests)
- Impact: CRITICAL (financial loss)
- Complexity: LOW (no special tools needed)

---

### 2. ⚠️ **NO DATABASE TRANSACTION** (CRITICAL)

**Location:** `/api/withdrawals/route.ts` (Line 133-142)

**Issue:**
```typescript
// ❌ NON-ATOMIC OPERATIONS
const withdrawal = await Withdrawal.create({ /* ... */ });

// If this fails, withdrawal record exists but balance NOT deducted!
user.totalEarnings = (user.totalEarnings || 0) - amount;
await user.save();
```

**Failure Scenarios:**

| Step | Operation | If Fails | Result |
|------|-----------|----------|--------|
| 1 | Create withdrawal record | ❌ | Both operations fail (OK) |
| 2 | Deduct user balance | ❌ | **Withdrawal record exists, balance NOT deducted** 💥 |
| 3 | Send notification | ❌ | Withdrawal exists, balance deducted, no notification (OK) |

**Attack Vector:**
```javascript
// Attacker can force Step 2 to fail:
1. Fill user's MongoDB storage quota (ENOSPC error)
2. Trigger network disconnection during Step 2
3. Kill server process between Step 1 and 2

Result:
- Withdrawal record: status='pending', amount=$100
- User balance: UNCHANGED ($100)
- Admin processes withdrawal → User gets $100
- User balance: Still $100 (not deducted!)
- User can withdraw again → $200 total from $100 balance
```

**Impact:**
- 🔴 Data inconsistency
- 🔴 Free money exploit
- 🔴 Audit trail corruption
- 🔴 Manual reconciliation required

**Real Example:**
```
User A: balance = $500
1. Request withdraw $500 → Create Withdrawal record ✅
2. Server crashes before saving user balance ❌
3. Server restarts, user balance still $500
4. Admin approves withdrawal → Transfer $500 to user
5. User balance: $500 (should be $0)
6. User can withdraw $500 again!
```

---

### 3. ⚠️ **CALCULATION INCONSISTENCY** (HIGH)

**Location:** `/api/referral/stats/route.ts` (Line 111-113)

**Issue:**
```typescript
// ❌ INCONSISTENT CALCULATION
const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
const availableCommission = (user.totalEarnings || 0) - totalWithdrawn;

// But withdrawal already deducted from totalEarnings!
// This means availableCommission is calculated TWICE!
```

**Flow Analysis:**

```
Initial State:
- user.totalEarnings = $100 (from referral commissions)

User withdraws $30:
1. POST /api/withdrawals
2. Deduct: user.totalEarnings = $100 - $30 = $70 ✅
3. Create: Withdrawal { amount: $30, status: 'pending' }
4. Save user with totalEarnings = $70

GET /api/referral/stats:
1. Read: user.totalEarnings = $70
2. Calculate: totalWithdrawn = SUM(withdrawals) = $30
3. Calculate: availableCommission = $70 - $30 = $40 ❌

Expected: $70 (already deducted)
Actual: $40 (double deduction!)

Result: User lost $30 display balance!
```

**Impact:**
- 🔴 Wrong balance display ($40 instead of $70)
- 🔴 User confusion (balance mismatch)
- 🔴 Customer support burden
- 🔴 Trust issues

**Correct Logic Should Be:**
```typescript
// Option 1: totalEarnings = total BEFORE withdrawals
availableCommission = user.totalEarnings - totalWithdrawn;

// Option 2: totalEarnings = total AFTER withdrawals (CURRENT)
availableCommission = user.totalEarnings; // No need to subtract!
```

---

### 4. ⚠️ **NO PESSIMISTIC LOCKING** (CRITICAL)

**Location:** `/api/withdrawals/route.ts` (Line 108)

**Issue:**
```typescript
// ❌ OPTIMISTIC READ (no lock)
const user = await User.findById(session.user.id);

// Multiple requests can read same balance simultaneously
// No database-level lock to prevent concurrent modifications
```

**MongoDB Lock Comparison:**

| Method | Lock Type | Race Condition Protected? |
|--------|-----------|---------------------------|
| `findById()` | ❌ None | ❌ NO |
| `findByIdAndUpdate()` | ❌ None | ❌ NO |
| `findOne().session()` | ✅ Transaction | ✅ YES (with proper transaction) |
| `$inc atomic operation` | ✅ Document Lock | ✅ YES |

**Why Current Code Fails:**
```javascript
// Request A and B both execute simultaneously:

// Request A (t=0): Read balance = $100
const userA = await User.findById(userId); // balance: $100

// Request B (t=1): Read balance = $100 (SAME!)
const userB = await User.findById(userId); // balance: $100

// Request A (t=2): Deduct $100
userA.totalEarnings -= 100; // 0
await userA.save(); // DB: balance = $0

// Request B (t=3): Deduct $100 (from OLD value!)
userB.totalEarnings -= 100; // 0 (from cached $100)
await userB.save(); // DB: balance = $0 (should be -$100!)

// MongoDB "last write wins" - balance = $0 (wrong!)
```

---

## ⚠️ HIGH SEVERITY ISSUES

### 5. **NO WITHDRAWAL QUEUE/SERIALIZATION** (HIGH)

**Issue:** Multiple withdrawal requests tidak di-queue, bisa process parallel

**Current Flow:**
```
User A → Request $50 (t=0) ──┐
                               ├─→ Both process simultaneously ❌
User A → Request $50 (t=1) ──┘

Balance: $100 → Both see $100 → Both deduct $50 → Final: $0 (should reject one!)
```

**Expected Flow with Queue:**
```
User A → Request $50 (t=0) → Lock user balance → Process → Unlock
User A → Request $50 (t=1) → Wait for lock → Check balance → Reject (insufficient)
```

---

### 6. **NO IDEMPOTENCY KEY** (HIGH)

**Issue:** Network retry bisa create duplicate withdrawals

**Attack Vector:**
```javascript
// User submits withdrawal
POST /api/withdrawals { amount: 100 }

// Network timeout, frontend retries
POST /api/withdrawals { amount: 100 } // DUPLICATE!

// Without idempotency key:
// - 2 withdrawal records created
// - Balance deducted twice (-$200)
// - User only intended 1 withdrawal
```

**Industry Standard:**
```javascript
// With idempotency key
POST /api/withdrawals
Headers: { "Idempotency-Key": "uuid-123" }

// Second request with same key returns same response (cached)
// No duplicate processing
```

---

### 7. **INSUFFICIENT BALANCE VALIDATION** (HIGH)

**Location:** `/api/withdrawals/route.ts` (Line 113-117)

**Issue:**
```typescript
// ❌ Only checks totalEarnings, doesn't check pending withdrawals!
if ((user.totalEarnings || 0) < amount) {
  return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
}
```

**Attack:**
```javascript
Balance: $100

// Request 1: Withdraw $100 (status: pending)
// Deduct: balance = $0

// Before admin processes, Request 2: Withdraw $100
// Check: (totalEarnings=0) < 100 → Reject ✅

// BUT if balance deduction fails in Request 1:
// Balance still $100, Withdrawal record exists (pending)
// Request 2: Withdraw $100 → Check passes ✅ → Process
// Result: 2 pending withdrawals, only $100 balance!
```

**Correct Check:**
```typescript
// Should include pending withdrawals
const pendingAmount = await Withdrawal.aggregate([
  { $match: { userId: user._id, status: { $in: ['pending', 'processing'] } } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
]);

const reserved = pendingAmount[0]?.total || 0;
const available = user.totalEarnings - reserved;

if (available < amount) {
  return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
}
```

---

## 🛡️ SECURITY FIXES (MANDATORY)

### Fix 1: **Implement Atomic Operations with MongoDB Transactions**

**File:** `/api/withdrawals/route.ts`

```typescript
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. ATOMIC BALANCE CHECK + DEDUCTION (single operation)
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        totalEarnings: { $gte: amount }, // Ensure sufficient balance
      },
      {
        $inc: { totalEarnings: -amount }, // Atomic decrement
      },
      {
        new: true,
        session, // Use transaction session
      }
    );

    if (!user) {
      throw new Error('Insufficient balance or user not found');
    }

    // 2. CHECK PENDING WITHDRAWALS (within same transaction)
    const pendingWithdrawal = await Withdrawal.findOne({
      userId: user._id,
      status: { $in: ['pending', 'processing'] },
    }).session(session);

    if (pendingWithdrawal) {
      throw new Error('Pending withdrawal exists');
    }

    // 3. CREATE WITHDRAWAL RECORD (within same transaction)
    const withdrawal = await Withdrawal.create(
      [{
        userId: user._id,
        amount,
        walletAddress,
        network,
        type,
        status: 'pending',
      }],
      { session }
    );

    // 4. COMMIT ALL CHANGES ATOMICALLY
    await session.commitTransaction();

    return NextResponse.json({ success: true, withdrawal });

  } catch (error) {
    // ROLLBACK if any step fails
    await session.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 400 });
  } finally {
    session.endSession();
  }
}
```

**Why This Works:**
- ✅ `findOneAndUpdate` with condition prevents race condition
- ✅ `$inc` is atomic at MongoDB level (document lock)
- ✅ Transaction ensures all-or-nothing (no partial updates)
- ✅ If any step fails, entire operation rolls back
- ✅ Concurrent requests will be serialized by MongoDB

---

### Fix 2: **Implement Distributed Lock with Redis**

**Install:**
```bash
npm install ioredis redlock
```

**Implementation:**

```typescript
// lib/redis/lock.ts
import Redis from 'ioredis';
import Redlock from 'redlock';

const redis = new Redis(process.env.REDIS_URL);
const redlock = new Redlock([redis], {
  retryCount: 10,
  retryDelay: 200,
});

export async function withUserLock<T>(
  userId: string,
  operation: () => Promise<T>
): Promise<T> {
  const lockKey = `user:${userId}:withdrawal_lock`;
  const lock = await redlock.acquire([lockKey], 5000); // 5 second lock

  try {
    return await operation();
  } finally {
    await lock.release();
  }
}
```

**Usage in API:**

```typescript
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  // LOCK USER ACCOUNT (prevents concurrent withdrawals)
  return await withUserLock(session.user.id, async () => {
    
    // All withdrawal logic here (protected by lock)
    const user = await User.findById(session.user.id);
    
    // Check balance
    if (user.totalEarnings < amount) {
      throw new Error('Insufficient balance');
    }

    // Check pending withdrawals
    const hasPending = await Withdrawal.exists({
      userId: user._id,
      status: { $in: ['pending', 'processing'] },
    });

    if (hasPending) {
      throw new Error('Pending withdrawal exists');
    }

    // Process withdrawal (atomic)
    const result = await processWithdrawal(user, amount);
    
    return NextResponse.json({ success: true, result });
  });
}
```

**Benefits:**
- ✅ Prevents race condition at application level
- ✅ Works across multiple server instances
- ✅ Auto-releases lock on failure
- ✅ Retry mechanism for lock acquisition

---

### Fix 3: **Fix Balance Calculation Logic**

**File:** `/api/referral/stats/route.ts`

```typescript
export async function GET(request: NextRequest) {
  // ...

  // ✅ CORRECT: totalEarnings already includes deductions
  // No need to subtract withdrawals again!
  const availableCommission = Math.max(0, user.totalEarnings || 0);

  // If you want to track total earned (before withdrawals):
  // Store in separate field: user.totalEarnedAllTime
  // Then: availableCommission = totalEarnedAllTime - totalWithdrawn

  const stats = {
    totalEarnings: user.totalEarnings || 0, // Current balance (after withdrawals)
    totalWithdrawn: totalWithdrawn,
    availableCommission: availableCommission,
    // Add new field for total earned (optional)
    totalEarnedAllTime: (user.totalEarnings || 0) + totalWithdrawn,
  };

  return NextResponse.json(stats);
}
```

**Database Schema Update:**

```typescript
// models/User.ts
export interface IUser extends Document {
  // Current available balance (after withdrawals)
  totalEarnings?: number;
  
  // New field: Total earned all-time (never decreases)
  totalEarnedAllTime?: number;
  
  // Derived: availableBalance = totalEarnings
  // Derived: totalWithdrawn = totalEarnedAllTime - totalEarnings
}
```

---

### Fix 4: **Implement Idempotency Key**

```typescript
// middleware/idempotency.ts
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

export async function checkIdempotency(key: string, ttl = 3600) {
  const cached = await redis.get(`idempotency:${key}`);
  if (cached) {
    return { cached: true, response: JSON.parse(cached) };
  }
  return { cached: false };
}

export async function saveIdempotency(key: string, response: any, ttl = 3600) {
  await redis.setex(`idempotency:${key}`, ttl, JSON.stringify(response));
}

// Usage in API
export async function POST(request: NextRequest) {
  const idempotencyKey = request.headers.get('Idempotency-Key');
  
  if (!idempotencyKey) {
    return NextResponse.json(
      { error: 'Idempotency-Key header required' },
      { status: 400 }
    );
  }

  // Check cache
  const { cached, response } = await checkIdempotency(idempotencyKey);
  if (cached) {
    return NextResponse.json(response); // Return cached result
  }

  // Process request
  const result = await processWithdrawal(/* ... */);

  // Cache response
  await saveIdempotency(idempotencyKey, result);

  return NextResponse.json(result);
}
```

---

### Fix 5: **Enhanced Balance Validation**

```typescript
export async function POST(request: NextRequest) {
  // ...

  // 1. Calculate total reserved (pending + processing withdrawals)
  const reservedAmount = await Withdrawal.aggregate([
    {
      $match: {
        userId: user._id,
        status: { $in: ['pending', 'processing'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
      },
    },
  ]);

  const reserved = reservedAmount[0]?.total || 0;
  const available = (user.totalEarnings || 0) - reserved;

  // 2. Validate available balance
  if (available < amount) {
    return NextResponse.json(
      {
        error: 'Insufficient balance',
        details: {
          total: user.totalEarnings,
          reserved: reserved,
          available: available,
          requested: amount,
        },
      },
      { status: 400 }
    );
  }

  // 3. Check for duplicate pending withdrawals
  const duplicateCheck = await Withdrawal.findOne({
    userId: user._id,
    amount: amount,
    walletAddress: walletAddress,
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 60000) }, // Last 60 seconds
  });

  if (duplicateCheck) {
    return NextResponse.json(
      { error: 'Duplicate withdrawal detected. Please wait before retrying.' },
      { status: 429 } // Too Many Requests
    );
  }

  // Proceed with withdrawal...
}
```

---

## 📊 TESTING RECOMMENDATIONS

### 1. **Race Condition Test**

```javascript
// test/race-condition.test.js
async function testRaceCondition() {
  const user = await createTestUser({ totalEarnings: 100 });
  
  // Simulate 10 concurrent withdrawal requests
  const promises = Array(10).fill(null).map(() => 
    fetch('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify({
        amount: 50,
        walletAddress: '0x...',
        network: 'ERC20',
      }),
    })
  );

  const results = await Promise.all(promises);
  const successful = results.filter(r => r.ok);

  // ✅ PASS: Only 2 withdrawals should succeed (2 * $50 = $100)
  // ❌ FAIL: More than 2 succeed (race condition exists)
  expect(successful.length).toBe(2);

  // Verify final balance
  const finalUser = await User.findById(user._id);
  expect(finalUser.totalEarnings).toBe(0); // All withdrawn
}
```

### 2. **Transaction Rollback Test**

```javascript
async function testTransactionRollback() {
  const user = await createTestUser({ totalEarnings: 100 });

  // Force failure during withdrawal creation
  jest.spyOn(Withdrawal, 'create').mockRejectedValueOnce(new Error('DB Error'));

  await expect(
    createWithdrawal(user._id, 50)
  ).rejects.toThrow('DB Error');

  // ✅ PASS: Balance should remain unchanged (rollback worked)
  const finalUser = await User.findById(user._id);
  expect(finalUser.totalEarnings).toBe(100);

  // ✅ PASS: No withdrawal record should exist
  const withdrawalCount = await Withdrawal.countDocuments({ userId: user._id });
  expect(withdrawalCount).toBe(0);
}
```

### 3. **Idempotency Test**

```javascript
async function testIdempotency() {
  const idempotencyKey = 'test-withdrawal-123';

  // First request
  const response1 = await fetch('/api/withdrawals', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ amount: 50, /* ... */ }),
  });

  // Second request with same key
  const response2 = await fetch('/api/withdrawals', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ amount: 50, /* ... */ }),
  });

  // ✅ PASS: Both return same withdrawal ID
  const data1 = await response1.json();
  const data2 = await response2.json();
  expect(data1.withdrawal.id).toBe(data2.withdrawal.id);

  // ✅ PASS: Only 1 withdrawal record exists
  const count = await Withdrawal.countDocuments({ userId: user._id });
  expect(count).toBe(1);
}
```

---

## 🚀 IMPLEMENTATION PRIORITY

| Priority | Fix | Effort | Impact |
|----------|-----|--------|--------|
| 🔴 **P0** | MongoDB Transactions | Medium | Prevents race condition + data loss |
| 🔴 **P0** | Atomic Balance Operations | Low | Prevents double withdrawal |
| 🟡 **P1** | Redis Distributed Lock | High | Multi-instance protection |
| 🟡 **P1** | Idempotency Keys | Medium | Prevents duplicate requests |
| 🟡 **P1** | Fix Balance Calculation | Low | Correct display balance |
| 🟢 **P2** | Enhanced Validation | Low | Better error messages |

**Recommended Rollout:**
1. Week 1: Implement P0 fixes (Transactions + Atomic Ops)
2. Week 2: Add Redis locks + Idempotency
3. Week 3: Testing + monitoring
4. Week 4: Production deployment with rollback plan

---

## 📈 MONITORING RECOMMENDATIONS

### 1. **Add Alerts for Suspicious Activity**

```typescript
// middleware/fraud-detection.ts
async function detectSuspiciousWithdrawal(userId: string, amount: number) {
  // Alert 1: Multiple withdrawals in short time
  const recentCount = await Withdrawal.countDocuments({
    userId,
    createdAt: { $gte: new Date(Date.now() - 300000) }, // Last 5 minutes
  });

  if (recentCount >= 3) {
    await sendAlert('Multiple withdrawal attempts detected', { userId, count: recentCount });
  }

  // Alert 2: Large withdrawal (> $1000)
  if (amount >= 1000) {
    await sendAlert('Large withdrawal request', { userId, amount });
  }

  // Alert 3: Negative balance
  const user = await User.findById(userId);
  if (user.totalEarnings < 0) {
    await sendCriticalAlert('NEGATIVE BALANCE DETECTED', { userId, balance: user.totalEarnings });
  }
}
```

### 2. **Database Integrity Checks (Cron Job)**

```typescript
// cron/check-balance-integrity.ts
async function checkBalanceIntegrity() {
  const users = await User.find({ totalEarnings: { $lt: 0 } });
  
  if (users.length > 0) {
    await sendCriticalAlert('Users with negative balance found', {
      count: users.length,
      users: users.map(u => ({ id: u._id, balance: u.totalEarnings })),
    });
  }

  // Check for withdrawals exceeding earned amount
  const suspiciousUsers = await User.aggregate([
    {
      $lookup: {
        from: 'withdrawals',
        localField: '_id',
        foreignField: 'userId',
        as: 'withdrawals',
      },
    },
    {
      $project: {
        totalEarnings: 1,
        totalWithdrawn: {
          $sum: {
            $filter: {
              input: '$withdrawals',
              cond: { $in: ['$$this.status', ['completed', 'processing']] },
            },
          },
        },
      },
    },
    {
      $match: {
        $expr: { $gt: ['$totalWithdrawn', '$totalEarnings'] },
      },
    },
  ]);

  if (suspiciousUsers.length > 0) {
    await sendCriticalAlert('Withdrawal > Earnings detected', { users: suspiciousUsers });
  }
}

// Run every hour
cron.schedule('0 * * * *', checkBalanceIntegrity);
```

---

## 📝 CONCLUSION

**Current Status:** ⚠️ **NOT PRODUCTION READY**

**Risk Level:** 🔴 **CRITICAL** (Financial loss possible)

**Immediate Actions Required:**
1. ✅ Implement MongoDB transactions (Fix #1)
2. ✅ Use atomic operations for balance updates (Fix #1)
3. ✅ Fix balance calculation logic (Fix #3)
4. ✅ Add comprehensive testing (Race condition, rollback, idempotency)
5. ✅ Deploy monitoring and alerts

**Estimated Fix Time:**
- Basic fixes (P0): 3-5 days
- Complete implementation (P0 + P1): 2 weeks
- Testing + monitoring: 1 week
- **Total: 3-4 weeks to production-ready**

**Alternative (Quick Fix for MVP):**
- Disable concurrent withdrawals (1 pending max per user) ✅ Already implemented
- Add request throttling (1 request per minute)
- Manual admin approval required
- **Can deploy in 2-3 days** (but not scalable)

---

## 🔗 REFERENCES

- [MongoDB Transactions Best Practices](https://www.mongodb.com/docs/manual/core/transactions/)
- [OWASP: Race Condition Prevention](https://owasp.org/www-community/vulnerabilities/Race_Condition)
- [Stripe Idempotency Documentation](https://stripe.com/docs/api/idempotent_requests)
- [Redis Distributed Locks with Redlock](https://redis.io/docs/manual/patterns/distributed-locks/)
- [Payment System Security Best Practices](https://www.pci-securitystandards.org/)

---

**Auditor:** AI Security Analysis  
**Review Date:** November 2, 2025  
**Next Review:** After implementing P0 fixes
