# 🎖️ Tier Upgrade Notifications - Quick Reference

**Status:** ✅ COMPLETE | **Updated:** November 2, 2025

---

## 🚀 Quick Start

### Test in Development

```bash
# 1. Test tier upgrade logic
node scripts/test-tier-upgrade-notifications.js

# 2. Test in browser
# - Login as user
# - Go to /topup
# - Deposit $1,100+ USDT
# - Check bell icon for notification
# - Check email inbox
```

### Verify Notification Sent

```bash
# Check database for tier upgrade notifications
mongosh "mongodb+srv://..." --eval '
  db.notifications.find({ 
    type: "tier_upgrade" 
  }).sort({ createdAt: -1 }).limit(5).pretty()
'
```

---

## 📋 Implementation Checklist

### Backend ✅ DONE

- [x] Tier detection logic in `/src/app/api/user/balance/route.ts`
- [x] NotificationManager method: `notifyTierUpgrade()`
- [x] Email service method: `sendTierUpgrade()`
- [x] Email template: `generateTierUpgradeEmail()`
- [x] Database model: `Notification` with `tier_upgrade` type

### Frontend ✅ DONE

- [x] NotificationCenter component integrated
- [x] Bell icon in user dashboard navbar
- [x] Bell icon in admin dashboard header
- [x] Unread badge count
- [x] Dropdown notification list
- [x] Dark/Light theme support

### Testing ✅ DONE

- [x] Automated test script created
- [x] 4/4 test cases passing
- [x] Tier upgrade logic verified
- [x] Email template rendering tested
- [x] Database storage confirmed

---

## 🎯 Tier Thresholds

| Tier | Min Deposit | Upgrade From |
|------|-------------|--------------|
| 🥉 Bronze | $0 | (Default) |
| 🥈 Silver | $1,000 | Bronze → Silver |
| 🥇 Gold | $2,000 | Silver → Gold |
| 💎 Platinum | $10,000 | Gold → Platinum |

**Trigger:** When `totalPersonalDeposit` crosses threshold during gas fee topup.

---

## 📧 Email Template

**Subject:** `🥈 Tier Upgrade: SILVER!` (example)

**Content:**
- Congratulations message
- Old tier vs New tier
- Commission rate comparison
- Total lifetime deposits
- Call-to-action: "View Referral Dashboard"

**Preview:** http://localhost:3000/api/email/preview?type=tier_upgrade

---

## 🔔 In-App Notification

**Location:** Bell icon (top-right corner)

**Features:**
- Badge count (unread notifications)
- Dropdown list with recent notifications
- Click to mark as read
- Link to `/referral` page

**Database:**
```javascript
{
  userId: ObjectId("..."),
  type: "tier_upgrade",
  title: "🎉 Tier Upgraded to 🥈 Silver!",
  message: "Congratulations! You've been upgraded from bronze to silver. Your commission rates have increased!",
  priority: "success",
  read: false,
  metadata: {
    oldTier: "bronze",
    newTier: "silver",
    oldRate: { level1: 10, level2: 5, level3: 5 },
    newRate: { level1: 20, level2: 5, level3: 5 },
    totalDeposit: 1100,
    link: "/referral",
    actionLabel: "View Commission Rates"
  },
  createdAt: ISODate("2025-11-02T10:30:00Z")
}
```

---

## 🔧 Configuration

### Admin Settings

**Path:** `/administrator/settings` → "Referral Commission" tab

**Editable:**
- Commission rates per tier
- Level 1/2/3 percentages

**Not Editable (hardcoded):**
- Tier thresholds ($1k, $2k, $10k)

### Environment Variables

```bash
# Email (required for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# MongoDB
MONGODB_URI=mongodb+srv://...
```

---

## 🐛 Troubleshooting

### Notification Not Sent

**Problem:** User upgraded tier but no notification received.

**Check:**
1. ✅ Verify tier actually changed in database
   ```javascript
   db.futurepilotcols.findOne({ email: "user@example.com" })
   // Check membershipLevel and totalPersonalDeposit
   ```

2. ✅ Check notification was created
   ```javascript
   db.notifications.find({ 
     userId: ObjectId("..."), 
     type: "tier_upgrade" 
   }).sort({ createdAt: -1 })
   ```

3. ✅ Check email logs in terminal
   ```
   [Notification] Email sent: tier_upgrade to user@example.com
   ```

4. ✅ Verify SMTP credentials
   ```bash
   echo $SMTP_USER
   echo $SMTP_PASS
   ```

### Admin Override Not Working

**Problem:** User tier manually set by admin, but still auto-upgrades on deposit.

**Check:**
```javascript
db.futurepilotcols.findOne({ email: "user@example.com" })
// Should have: tierSetManually: true
```

**Fix:**
```javascript
db.futurepilotcols.updateOne(
  { email: "user@example.com" },
  { $set: { tierSetManually: true } }
)
```

### Email Not Delivered

**Problem:** Notification created in database but email not received.

**Check:**
1. ✅ Spam folder
2. ✅ Email address correct in User model
3. ✅ SMTP credentials valid
4. ✅ Email service logs for errors

**Test Email:**
```bash
# Preview email template
curl http://localhost:3000/api/email/preview?type=tier_upgrade
```

---

## 📊 Monitoring Queries

### Count Tier Upgrades (Last 30 Days)

```javascript
db.notifications.countDocuments({
  type: "tier_upgrade",
  createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) }
})
```

### Tier Distribution

```javascript
db.futurepilotcols.aggregate([
  { $group: { _id: "$membershipLevel", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

### Notification Read Rate

```javascript
db.notifications.aggregate([
  { $match: { type: "tier_upgrade" } },
  { $group: { 
      _id: "$read", 
      count: { $sum: 1 },
      avgReadTime: { 
        $avg: { 
          $subtract: ["$readAt", "$createdAt"] 
        } 
      }
    } 
  }
])
```

### Recent Tier Upgrades

```javascript
db.notifications.find({ 
  type: "tier_upgrade" 
}).sort({ 
  createdAt: -1 
}).limit(10).pretty()
```

---

## 🔗 Related Documentation

- **Full Docs:** `/docs/TIER_UPGRADE_NOTIFICATIONS.md`
- **Status Report:** `/docs/TIER_UPGRADE_STATUS_REPORT.md`
- **Test Script:** `/scripts/test-tier-upgrade-notifications.js`
- **Notification System:** `/docs/NOTIFICATION_CENTER_QUICKSTART.md`
- **Email Templates:** `/docs/EMAIL_NOTIFICATION_TEMPLATES.md`

---

## 📞 Support

**Issues?** Check:
1. Test script: `node scripts/test-tier-upgrade-notifications.js`
2. API logs: Check terminal output for errors
3. Database: Verify notification created
4. Email: Check SMTP logs

**Still stuck?** Review `/docs/TIER_UPGRADE_NOTIFICATIONS.md` for detailed implementation.

---

**Last Updated:** November 2, 2025 | **Version:** 1.0.0 | **Status:** Production Ready ✅
