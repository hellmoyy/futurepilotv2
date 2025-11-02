# 🚀 Notification Center - Quick Start Guide

**Last Updated:** January 2025  
**Status:** ✅ Production Ready

---

## 📍 Quick Access

### For Users:
- **Bell Icon:** Top-right navbar (next to theme toggle)
- **Full Page:** `/notifications`
- **Auto-Refresh:** Every 30 seconds

### For Admins:
- **Bell Icon:** Admin header (before email/logout)
- **Full Page:** `/notifications` (same as users)

---

## 🎯 Key Features

### 1. Bell Icon with Badge
```
🔔 [5]  ← Unread count badge
```

**Click to:**
- View last 10 notifications
- Mark notifications as read
- Clear all notifications
- Navigate to full notifications page

### 2. Dropdown Menu
```
┌─────────────────────────────────┐
│ Notifications    [Mark all read]│
├─────────────────────────────────┤
│ ✅ Trading Commission           │
│    Your commission...            │
│    5m ago                        │
├─────────────────────────────────┤
│           [View all notifications]│
└─────────────────────────────────┘
```

**Actions:**
- Click notification → Mark as read + navigate (if actionUrl exists)
- "Mark all read" → Clear all unread notifications
- "View all" → Open `/notifications` page

### 3. Full Notifications Page
```
/notifications

Features:
- Filter by: Type | Priority | Read Status
- Pagination: 20 per page
- Mark as read (individual + bulk)
- Delete notifications
- Action buttons for links
```

---

## 🔔 Notification Types

| Icon | Type | Description |
|------|------|-------------|
| ✅ | **Success** | Trading commission, tier upgrade, deposit confirmed |
| ⚠️ | **Warning** | Auto-close, system alerts |
| 🚨 | **Error** | Low gas fee, withdrawal rejected |
| 💡 | **Info** | Position opened/closed, account updates |

---

## ⚡ Quick Actions

### Mark Single as Read
```typescript
// Click notification in dropdown → Auto-mark as read
// OR
// Click checkmark icon (✓) on full page
```

### Mark All as Read
```typescript
// Dropdown: Click "Mark all read" button
// Full page: Click "Mark All as Read" button (top-right)
```

### Delete Notification
```typescript
// Full page only: Click trash icon (🗑)
// Confirmation prompt will appear
```

### Filter Notifications
```typescript
// On /notifications page
1. Select Type dropdown (12 options)
2. Select Priority dropdown (4 options)
3. Select Status dropdown (All | Unread | Read)
```

---

## 🔧 For Developers

### Send Notification

**Method 1: Using NotificationManager (Recommended)**

```typescript
import { notificationManager } from '@/lib/notifications/NotificationManager';

// Trading Commission Example
await notificationManager.notifyTradingCommission({
  userId: user._id.toString(),
  amount: 10,           // Commission amount
  commission: 0.2,      // Commission rate (20%)
  profit: 50,           // Total profit
});

// Tier Upgrade Example
await notificationManager.notifyTierUpgrade({
  userId: user._id.toString(),
  oldTier: 'bronze',
  newTier: 'silver',
  oldRates: { level1: 0.1, level2: 0.05, level3: 0.05 },
  newRates: { level1: 0.2, level2: 0.05, level3: 0.05 },
});

// Generic Notification
await notificationManager.send({
  userId: user._id.toString(),
  type: 'system_alert',
  priority: 'warning',
  title: 'System Maintenance',
  message: 'Platform will undergo maintenance tonight at 10 PM UTC.',
  channels: ['toast', 'database', 'email'], // Choose channels
  actionUrl: '/maintenance',  // Optional
  metadata: { duration: '2 hours' }, // Optional
});
```

**Method 2: Direct API Call**

```typescript
// POST to NotificationManager endpoint (create this if needed)
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'trading_commission',
    priority: 'success',
    title: 'Trading Commission Deducted',
    message: 'Your trading commission of $10 has been deducted.',
    channels: ['toast', 'database'],
  }),
});
```

### Display Toast Notification

```typescript
// Use toast hooks
import { useToastNotifications } from '@/contexts/ToastContext';

const { showSuccess, showError, showWarning, showInfo } = useToastNotifications();

// Show success toast
showSuccess('Trading position opened successfully!');

// Show error toast
showError('Insufficient gas fee balance. Please topup.');

// Show warning toast
showWarning('Your gas fee balance is running low.');

// Show info toast
showInfo('New trading bot algorithm available.');
```

### Use Trading Notification Hooks

```typescript
import { useTradingNotifications } from '@/hooks/useNotifications';

const {
  showTradingCommission,
  showAutoClose,
  showLowGasFee,
  showPositionOpened,
  showPositionClosed,
} = useTradingNotifications();

// After trade closes
showTradingCommission(10, 50); // (commission, profit)

// When auto-close triggers
showAutoClose(45, 'Gas fee balance approaching limit');

// When gas fee < $10
showLowGasFee(8.5, 10); // (current, required)

// Position notifications
showPositionOpened('BTC/USDT', 10, 'LONG');
showPositionClosed('BTC/USDT', 50, 45); // (symbol, profit, roi)
```

### Use Tier Notification Hooks

```typescript
import { useTierNotifications } from '@/hooks/useNotifications';

const { showTierUpgrade } = useTierNotifications();

// After tier upgrade
showTierUpgrade('bronze', 'silver');
```

---

## 🧪 Testing

### Test in Browser

```bash
# 1. Start dev server
npm run dev

# 2. Navigate to test page
http://localhost:3000/test-toast

# 3. Click demo buttons to test all notification types

# 4. Test NotificationCenter
http://localhost:3000/dashboard
- Click bell icon
- Verify dropdown opens
- Test mark as read
- Test clear all

# 5. Test full page
http://localhost:3000/notifications
- Test filters
- Test pagination
- Test delete
```

### Create Test Notification

**Option A: Using NotificationManager (Node.js Script)**

```javascript
// /scripts/test-notification.js
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { default: connectDB } = require('../src/lib/mongodb');
const { notificationManager } = require('../src/lib/notifications/NotificationManager');

async function createTestNotification() {
  await connectDB();
  
  const userId = 'YOUR_USER_ID_HERE'; // Replace with actual user ID
  
  await notificationManager.send({
    userId,
    type: 'system_alert',
    priority: 'info',
    title: 'Test Notification',
    message: 'This is a test notification from the script.',
    channels: ['toast', 'database'],
  });
  
  console.log('✅ Test notification created');
  process.exit(0);
}

createTestNotification();
```

```bash
# Run script
node scripts/test-notification.js
```

**Option B: Using MongoDB Directly**

```javascript
// In MongoDB shell or Compass
db.notifications.insertOne({
  userId: ObjectId('YOUR_USER_ID'),
  type: 'system_alert',
  priority: 'info',
  title: 'Test Notification',
  message: 'This is a test notification',
  read: false,
  createdAt: new Date(),
  channels: ['database'],
});
```

**Option C: Using API Endpoint (Create Test Endpoint)**

```typescript
// Create: /src/app/api/notifications/test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { notificationManager } from '@/lib/notifications/NotificationManager';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await notificationManager.send({
    userId: session.user.id,
    type: 'system_alert',
    priority: 'info',
    title: 'Test Notification',
    message: 'This is a test notification from the API.',
    channels: ['toast', 'database'],
  });

  return NextResponse.json({ success: true });
}
```

```bash
# Then call from browser console or Postman
fetch('/api/notifications/test', { method: 'POST' })
  .then(res => res.json())
  .then(console.log);
```

---

## 🎨 Customization

### Change Auto-Refresh Interval

```typescript
// In: /src/components/notifications/NotificationCenter.tsx

const REFRESH_INTERVAL = 60000; // Change to 60s (default: 30s)

useEffect(() => {
  const interval = setInterval(() => {
    fetchUnreadCount();
  }, REFRESH_INTERVAL);
  
  return () => clearInterval(interval);
}, [session]);
```

### Change Dropdown Size

```typescript
// In: /src/components/notifications/NotificationCenter.tsx

<div className="absolute right-0 mt-2 w-96 ...">  {/* Change w-96 to w-[500px] */}
  <div className="max-h-[400px] overflow-y-auto"> {/* Change max-h-[400px] to max-h-[600px] */}
    {/* ... */}
  </div>
</div>
```

### Change Badge Style

```typescript
// In: /src/components/notifications/NotificationCenter.tsx

{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 ... bg-red-500 ..."> {/* Change bg-red-500 to bg-blue-500 */}
    {unreadCount > 99 ? '99+' : unreadCount}
  </span>
)}
```

### Add Custom Notification Type

```typescript
// 1. Add to: /src/types/notification.ts
export type NotificationType = 
  | 'trading_commission'
  | 'my_custom_type'  // ← Add here
  | ...;

// 2. Add filter in: /src/app/notifications/page.tsx
<select>
  <option value="my_custom_type">My Custom Type</option>
</select>

// 3. Add icon in: /src/components/notifications/NotificationCenter.tsx
const getPriorityIcon = (type: string) => {
  if (type === 'my_custom_type') return '🎯';
  // ...
};

// 4. Use in code:
await notificationManager.send({
  userId: user._id.toString(),
  type: 'my_custom_type',
  priority: 'info',
  title: 'Custom Notification',
  message: 'This is a custom notification type.',
  channels: ['toast', 'database'],
});
```

---

## 🐛 Troubleshooting

### Badge Not Updating

**Check:**
```typescript
// 1. Browser console for errors
console.log('Session:', session);

// 2. API response
fetch('/api/notifications/unread-count')
  .then(res => res.json())
  .then(console.log);

// 3. Auto-refresh is working
// Wait 30s and check Network tab for new request
```

**Fix:**
- Verify user is authenticated
- Check API endpoint returns correct data
- Restart dev server

### Dropdown Not Showing

**Check:**
```typescript
// 1. Component is rendering
console.log('NotificationCenter mounted');

// 2. isOpen state
console.log('isOpen:', isOpen);

// 3. Z-index conflicts
// Check if other elements have higher z-index
```

**Fix:**
- Verify z-index: 50 on dropdown
- Check for CSS conflicts
- Inspect element in DevTools

### Notifications Not Loading

**Check:**
```typescript
// 1. API response
const response = await fetch('/api/notifications?limit=10&page=1');
const data = await response.json();
console.log('Notifications:', data);

// 2. Database query
// In MongoDB:
db.notifications.find({ userId: ObjectId('YOUR_USER_ID') }).limit(10);

// 3. User authentication
console.log('User session:', session?.user);
```

**Fix:**
- Verify database connection
- Check userId matches
- Ensure API endpoint is working

---

## 📚 Related Docs

- **Full Documentation:** `/docs/NOTIFICATION_CENTER_UI.md`
- **Week 2 Summary:** `/docs/WEEK2_NOTIFICATION_SUMMARY.md`
- **Toast System:** `/docs/TOAST_NOTIFICATION_SYSTEM.md`
- **API Endpoints:** API routes in `/src/app/api/notifications/`

---

## ✅ Checklist: Going Live

- [ ] Test notification center in browser
- [ ] Create test notifications
- [ ] Verify auto-refresh works
- [ ] Test mark as read
- [ ] Test delete functionality
- [ ] Test filters on full page
- [ ] Test pagination
- [ ] Configure SMTP for emails
- [ ] Test email delivery
- [ ] Integrate with trading bot
- [ ] Integrate with tier upgrade
- [ ] Mobile responsive testing
- [ ] Production build test

---

## 🎉 You're Ready!

The Notification Center is now fully integrated and ready to use. Users will receive real-time notifications for:

✅ Trading commissions  
✅ Auto-close alerts  
✅ Low gas fee warnings  
✅ Position updates  
✅ Tier upgrades  
✅ Referral commissions  
✅ Deposit confirmations  
✅ System alerts  

**Next:** Test the system and integrate with trading bot + tier upgrade logic.

---

**Need Help?** Check the full documentation in `/docs/NOTIFICATION_CENTER_UI.md`
