# Withdrawal System Documentation

## Overview
Complete USDT withdrawal system for referral commission earnings with ERC20 and BEP20 network support.

## Features

### ✅ Completed

1. **User Withdrawal Request**
   - Minimum withdrawal: $10 USD
   - Support for ERC20 (Ethereum) and BEP20 (BSC) networks
   - Wallet address validation (0x format, 42 characters)
   - Real-time balance checking
   - Duplicate pending withdrawal prevention

2. **Withdrawal History**
   - Complete withdrawal transaction history
   - Statistics dashboard (Total, Pending, Processing, Completed, Total Withdrawn)
   - Status tracking: Pending → Processing → Completed/Rejected
   - Transaction hash display with blockchain explorer links
   - Mobile-responsive table design

3. **Database Models**
   - Withdrawal model with comprehensive validation
   - User model with saved withdrawal wallets
   - Indexed queries for performance

4. **API Endpoints**
   - `GET /api/withdrawals` - Fetch withdrawal history & stats
   - `POST /api/withdrawals` - Submit withdrawal request
   - `GET /api/withdrawals/wallets` - Get saved wallet addresses
   - `POST /api/withdrawals/wallets` - Save/update wallet addresses

## Architecture

### Database Schema

#### Withdrawal Model (`/models/Withdrawal.ts`)
```typescript
{
  userId: ObjectId (indexed)
  amount: Number (min: $10)
  walletAddress: String (validated: /^0x[a-fA-F0-9]{40}$/)
  network: 'ERC20' | 'BEP20'
  status: 'pending' | 'processing' | 'completed' | 'rejected' (indexed)
  transactionHash?: String (validated: /^0x[a-fA-F0-9]{64}$/)
  rejectionReason?: String
  type: 'referral' | 'trading'
  requestedAt: Date (default: now)
  processedAt?: Date
  completedAt?: Date
}
```

**Indexes:**
- `{ userId: 1, status: 1 }` - Fast status filtering per user
- `{ userId: 1, createdAt: -1 }` - Chronological history

**Virtual Fields:**
- `isPendingTooLong` - Returns true if pending > 24 hours

#### User Model Update (`/models/User.ts`)
```typescript
{
  ...existingFields,
  withdrawalWallets?: {
    erc20?: String (validated: /^0x[a-fA-F0-9]{40}$/)
    bep20?: String (validated: /^0x[a-fA-F0-9]{40}$/)
    verified?: Boolean
    addedAt?: Date
  }
}
```

### API Endpoints

#### 1. Submit Withdrawal Request
**Endpoint:** `POST /api/withdrawals`

**Request Body:**
```json
{
  "amount": 100,
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
  "network": "ERC20",
  "type": "referral"
}
```

**Validations:**
- ✅ Amount >= $10
- ✅ Valid wallet address format
- ✅ Network must be ERC20 or BEP20
- ✅ User has sufficient balance
- ✅ No existing pending/processing withdrawals
- ✅ User is authenticated

**Process:**
1. Validate all inputs
2. Check user balance (totalEarnings)
3. Check for existing pending withdrawals
4. Create Withdrawal document with status 'pending'
5. Deduct amount from user.totalEarnings
6. Save user and withdrawal
7. Return success response

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal request submitted successfully",
  "withdrawal": {
    "_id": "...",
    "amount": 100,
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
    "network": "ERC20",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 2. Get Withdrawal History
**Endpoint:** `GET /api/withdrawals?status=pending&limit=50`

**Query Parameters:**
- `status` (optional): Filter by status (pending, processing, completed, rejected)
- `limit` (optional): Number of records to return (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "withdrawals": [
    {
      "_id": "...",
      "amount": 150,
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
      "network": "ERC20",
      "status": "completed",
      "transactionHash": "0x1234567890abcdef...",
      "type": "referral",
      "requestedAt": "2024-01-15T10:30:00.000Z",
      "completedAt": "2024-01-16T14:20:00.000Z"
    }
  ],
  "statistics": {
    "total": 5,
    "pending": 1,
    "processing": 0,
    "completed": 3,
    "rejected": 1,
    "totalWithdrawn": 450
  }
}
```

#### 3. Save Withdrawal Wallets
**Endpoint:** `POST /api/withdrawals/wallets`

**Request Body:**
```json
{
  "erc20": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
  "bep20": "0x8ba1f109551bD432803012645Ac136ddd64DBA72"
}
```

**Validations:**
- ✅ At least one wallet address required
- ✅ Valid format for each provided address
- ✅ User is authenticated

**Response:**
```json
{
  "success": true,
  "message": "Withdrawal wallets updated successfully",
  "wallets": {
    "erc20": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
    "bep20": "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    "verified": false,
    "addedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 4. Get Saved Wallets
**Endpoint:** `GET /api/withdrawals/wallets`

**Response:**
```json
{
  "success": true,
  "wallets": {
    "erc20": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
    "bep20": "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    "verified": true,
    "addedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Frontend Components

### Referral Page Updates (`/app/referral/page.tsx`)

#### 1. State Management
```typescript
const [showWithdrawModal, setShowWithdrawModal] = useState(false);
const [withdrawAmount, setWithdrawAmount] = useState('');
const [withdrawWallet, setWithdrawWallet] = useState('');
const [withdrawNetwork, setWithdrawNetwork] = useState<'ERC20' | 'BEP20'>('ERC20');
const [withdrawLoading, setWithdrawLoading] = useState(false);
const [withdrawError, setWithdrawError] = useState('');
const [withdrawSuccess, setWithdrawSuccess] = useState('');
const [withdrawals, setWithdrawals] = useState<any[]>([]);
const [withdrawalStats, setWithdrawalStats] = useState<any>(null);
const [withdrawalLoading, setWithdrawalLoading] = useState(false);
```

#### 2. Withdrawal Modal
- **Location:** Referral page, opened by button click
- **Features:**
  - Available balance display
  - Amount input with $10 minimum
  - Network selector (ERC20/BEP20)
  - Wallet address input with validation
  - Warning notice about processing time and fees
  - Real-time form validation
  - Success/error message display
  - Loading state during submission

#### 3. Withdrawal History Tab
- **Location:** 4th tab in referral dashboard ("Withdraw")
- **Components:**
  - Statistics cards (Total, Pending, Processing, Completed, Total Withdrawn)
  - Transaction history table
  - Status badges (color-coded)
  - Transaction hash links to blockchain explorers
  - Mobile-responsive design

#### 4. Functions

**fetchWithdrawals()**
```typescript
// Fetches withdrawal history and statistics
// Called when "Withdraw" tab is activated
```

**handleWithdrawRequest()**
```typescript
// Validates and submits withdrawal request
// Shows success/error messages
// Refreshes stats and withdrawal history
// Auto-closes modal after 3 seconds on success
```

## Validation Rules

### Client-Side
1. **Amount:**
   - Must be a number
   - Minimum: $10.00
   - Maximum: User's available balance
   - Real-time validation

2. **Wallet Address:**
   - Must match regex: `/^0x[a-fA-F0-9]{40}$/`
   - 42 characters total (including 0x prefix)
   - Case-insensitive
   - Real-time validation

3. **Network:**
   - Must be either 'ERC20' or 'BEP20'
   - Required field

### Server-Side
All client-side validations repeated on server, plus:
1. **Authentication:** User must be logged in
2. **Balance Check:** User must have sufficient totalEarnings
3. **Duplicate Prevention:** No pending/processing withdrawals allowed
4. **Rate Limiting:** (TODO - implement rate limiting)

## User Flow

### 1. Request Withdrawal
```
User -> Referral Page -> Overview Card
  -> Check balance >= $10
  -> Click "Request Withdrawal" button
  -> Modal opens
  -> Enter amount, wallet address, select network
  -> Click "Submit Withdrawal Request"
  -> Validation runs
  -> POST /api/withdrawals
  -> Success: Balance deducted, modal closes
  -> Failure: Error message displayed
```

### 2. View History
```
User -> Referral Page -> "Withdraw" Tab
  -> GET /api/withdrawals
  -> Display statistics cards
  -> Display transaction table
  -> Click TX hash -> Opens blockchain explorer
```

### 3. Admin Processing (Future)
```
Admin Panel -> Withdrawals List
  -> Filter by status
  -> View pending withdrawals
  -> Verify wallet address
  -> Send USDT via wallet/exchange
  -> Enter transaction hash
  -> Mark as "completed"
  -> User receives notification
```

## Security Features

### Current Implementation
1. ✅ **Authentication Required:** NextAuth.js session validation
2. ✅ **Input Validation:** Regex patterns for wallet addresses
3. ✅ **Balance Verification:** Server-side balance checks
4. ✅ **Duplicate Prevention:** One pending withdrawal at a time
5. ✅ **Immediate Deduction:** Balance deducted on request to prevent double-spending

### Recommended Additions
1. ⏳ **2FA Requirement:** Require 2FA for withdrawals
2. ⏳ **Email Confirmation:** Send confirmation link before processing
3. ⏳ **IP Logging:** Track IP addresses for security audits
4. ⏳ **Daily Limits:** Maximum withdrawal amount per day
5. ⏳ **Cooldown Period:** Minimum time between withdrawals
6. ⏳ **Wallet Verification:** Require wallet ownership proof
7. ⏳ **Rate Limiting:** Prevent spam requests

## Network Information

### ERC20 (Ethereum)
- **Token:** USDT (Tether USD)
- **Contract:** `0xdAC17F958D2ee523a2206206994597C13D831ec7`
- **Network:** Ethereum Mainnet
- **Explorer:** https://etherscan.io
- **Typical Gas Fee:** $5 - $50 (variable)
- **Confirmation Time:** ~15 seconds - 5 minutes

### BEP20 (Binance Smart Chain)
- **Token:** USDT (Tether USD)
- **Contract:** `0x55d398326f99059fF775485246999027B3197955`
- **Network:** BSC Mainnet
- **Explorer:** https://bscscan.com
- **Typical Gas Fee:** $0.10 - $1.00 (variable)
- **Confirmation Time:** ~3 seconds

## Error Handling

### Common Errors

1. **Insufficient Balance**
   - Message: "Insufficient balance"
   - Action: Display error, disable submit button

2. **Invalid Wallet Address**
   - Message: "Please enter a valid wallet address"
   - Action: Display error, highlight input

3. **Minimum Amount**
   - Message: "Minimum withdrawal amount is $10"
   - Action: Display error, show minimum requirement

4. **Duplicate Request**
   - Message: "You already have a pending withdrawal request"
   - Action: Display error, redirect to history

5. **Server Error**
   - Message: "An error occurred. Please try again."
   - Action: Display error, allow retry

## Testing

### Manual Testing Checklist

#### Withdrawal Request
- [ ] Submit with amount < $10 (should fail)
- [ ] Submit with amount > balance (should fail)
- [ ] Submit with invalid wallet format (should fail)
- [ ] Submit with valid data (should succeed)
- [ ] Check balance deduction (should update immediately)
- [ ] Try duplicate request (should fail)
- [ ] Check modal close on success
- [ ] Check error message display

#### Withdrawal History
- [ ] Open "Withdraw" tab
- [ ] Check statistics display
- [ ] Check table display
- [ ] Click transaction hash link
- [ ] Check status colors
- [ ] Test on mobile device
- [ ] Check loading state

#### Edge Cases
- [ ] Submit with exactly $10
- [ ] Submit with all available balance
- [ ] Test with 0 balance
- [ ] Test network selector
- [ ] Test form reset after success
- [ ] Test concurrent requests
- [ ] Test session expiration

### API Testing
```bash
# Test withdrawal request
curl -X POST http://localhost:3000/api/withdrawals \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
    "network": "ERC20",
    "type": "referral"
  }'

# Test get history
curl http://localhost:3000/api/withdrawals

# Test get wallets
curl http://localhost:3000/api/withdrawals/wallets

# Test save wallets
curl -X POST http://localhost:3000/api/withdrawals/wallets \
  -H "Content-Type: application/json" \
  -d '{
    "erc20": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6",
    "bep20": "0x8ba1f109551bD432803012645Ac136ddd64DBA72"
  }'
```

## Future Enhancements

### Phase 1: Security & UX (Priority: HIGH)
1. **2FA Integration**
   - Require 2FA for withdrawals > $500
   - Add 2FA setup wizard

2. **Email Notifications**
   - Withdrawal requested confirmation
   - Processing notification
   - Completion notification with TX hash
   - Rejection notification with reason

3. **Wallet Management Page**
   - Save multiple wallets per network
   - Nickname wallets
   - Set default wallet
   - Verify wallet ownership

### Phase 2: Admin Features (Priority: HIGH)
1. **Admin Dashboard**
   - View all pending withdrawals
   - Bulk actions
   - Approval workflow
   - Transaction hash entry
   - Rejection with reason

2. **Processing Automation**
   - Auto-detect duplicate requests
   - Flag suspicious withdrawals
   - Calculate network fees
   - Track processing time

3. **Reporting**
   - Daily/weekly/monthly withdrawal reports
   - Network usage statistics
   - Fee analysis
   - User withdrawal patterns

### Phase 3: Advanced Features (Priority: MEDIUM)
1. **Automatic Processing**
   - Integration with exchange API
   - Automatic USDT transfers
   - Webhook confirmations
   - Error recovery

2. **Multi-Currency Support**
   - Add USDC support
   - Add native tokens (ETH, BNB)
   - Currency conversion

3. **Enhanced Analytics**
   - Withdrawal trends
   - Network performance
   - User behavior analysis
   - Fraud detection

### Phase 4: Optimization (Priority: LOW)
1. **Performance**
   - Implement caching
   - Database query optimization
   - Pagination for large histories

2. **UX Improvements**
   - QR code wallet input
   - Address book
   - Transaction receipts
   - Mobile app

## Troubleshooting

### Issue: Withdrawal Request Fails
**Symptoms:** Error message, request not created
**Possible Causes:**
1. Insufficient balance
2. Invalid wallet format
3. Existing pending withdrawal
4. Database connection issue

**Solutions:**
1. Check user balance in database
2. Verify wallet address format
3. Check for existing pending withdrawals
4. Check MongoDB connection
5. Review server logs

### Issue: Balance Not Updated
**Symptoms:** Balance shows old amount after withdrawal
**Possible Causes:**
1. Cache not refreshed
2. Database update failed
3. Race condition

**Solutions:**
1. Force refresh stats (`fetchReferralStats()`)
2. Check database transaction logs
3. Verify withdrawal document created
4. Check user.totalEarnings value

### Issue: Transaction Hash Not Showing
**Symptoms:** TX hash shows "-" for completed withdrawal
**Possible Causes:**
1. Admin didn't enter TX hash
2. Database field empty
3. Wrong network explorer link

**Solutions:**
1. Check withdrawal document in database
2. Verify transactionHash field
3. Update manually if needed
4. Check network field matches TX network

## Support & Maintenance

### Logs to Monitor
1. Failed withdrawal attempts
2. Duplicate request attempts
3. Invalid wallet addresses
4. Pending withdrawals > 48 hours
5. Network errors

### Regular Tasks
1. Review pending withdrawals daily
2. Monitor total withdrawn amounts
3. Check for stuck transactions
4. Verify wallet balances
5. Update network fee estimates

### Emergency Procedures
1. **Suspected Fraud:**
   - Freeze user account
   - Cancel pending withdrawals
   - Investigate transaction history
   - Contact user

2. **Network Issues:**
   - Pause new withdrawals
   - Monitor blockchain status
   - Update users via notification

3. **Database Issues:**
   - Enable read-only mode
   - Backup current data
   - Restore from backup if needed

## Configuration

### Environment Variables
```env
# Add to .env.local
WITHDRAWAL_MIN_AMOUNT=100
WITHDRAWAL_MAX_AMOUNT=10000
WITHDRAWAL_DAILY_LIMIT=50000
PROCESSING_TIME_HOURS=48
ENABLE_2FA_WITHDRAWAL=false
ENABLE_EMAIL_NOTIFICATIONS=false
```

### Feature Flags
```typescript
// config/withdrawal.ts
export const withdrawalConfig = {
  minAmount: 100,
  maxAmount: 10000,
  dailyLimit: 50000,
  processingTimeHours: 48,
  require2FA: false,
  enableEmailNotifications: false,
  supportedNetworks: ['ERC20', 'BEP20'],
  autoProcessing: false,
};
```

## Changelog

### Version 1.0.0 (2024-01-15)
- ✅ Initial release
- ✅ Basic withdrawal request functionality
- ✅ Withdrawal history display
- ✅ ERC20 and BEP20 support
- ✅ Wallet address validation
- ✅ Balance management
- ✅ Status tracking
- ✅ Mobile-responsive UI

---

**Last Updated:** 2024-01-15  
**Author:** FuturePilot Development Team  
**Version:** 1.0.0
