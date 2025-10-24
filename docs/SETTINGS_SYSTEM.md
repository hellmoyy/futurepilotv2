# Settings System - Complete Documentation

## 📋 Overview
Sistem settings yang terorganisir dengan pemisahan halaman CEX settings dan User settings dengan tab-tab.

## 🔄 URL Structure Changes

### Before:
- `/settings` - Mixed CEX and user settings

### After:
- `/settings` - User settings (Profile, Security, Trading, Notifications)
- `/cex-settings` - CEX connections (Binance, Bybit, KuCoin, OKX)
- `/check-settings` - Settings status overview

## 📁 File Structure

```
src/
├── app/
│   ├── settings/
│   │   └── page.tsx                    # Main settings page with tabs
│   ├── cex-settings/
│   │   ├── page.tsx                    # CEX exchange connections (old settings)
│   │   └── layout.tsx
│   └── check-settings/
│       └── page.tsx                    # Settings status overview
│
├── components/
│   └── settings/
│       ├── ProfileTab.tsx              # Profile information tab
│       ├── SecurityTab.tsx             # Security & 2FA tab
│       ├── ExchangeTab.tsx             # Redirect to CEX settings
│       ├── TradingTab.tsx              # Trading preferences tab
│       └── NotificationsTab.tsx        # Notification preferences tab
│
└── api/
    └── settings/
        └── status/
            └── route.ts                # Settings status API
```

## 🎯 Pages Description

### 1. `/settings` - Main Settings Page

**Purpose:** Central hub for all user account settings

**Features:**
- Tab-based navigation
- Sidebar with quick links
- Smooth transitions between tabs
- Mobile responsive

**Tabs:**
1. **Profile** - Personal information
2. **Security** - 2FA, password, account security
3. **Exchange** - Quick redirect to CEX settings
4. **Trading** - Risk management, trading preferences
5. **Notifications** - Email, Telegram, push alerts

**Navigation:**
```typescript
/settings                    # Default: Profile tab
/settings?tab=profile        # Profile tab
/settings?tab=security       # Security tab
/settings?tab=exchange       # Redirects to /cex-settings
/settings?tab=trading        # Trading tab
/settings?tab=notifications  # Notifications tab
```

### 2. `/cex-settings` - CEX Exchange Settings

**Purpose:** Manage cryptocurrency exchange connections

**Features:**
- Connect multiple exchanges (Binance, Bybit, KuCoin, OKX)
- API key management
- Balance display
- Test connection
- Testnet support
- Spot & Futures permissions

**Old URL:** `/settings` (renamed)

### 3. `/check-settings` - Settings Status Overview

**Purpose:** Quick overview of account configuration status

**Features:**
- Overall completion percentage (circular progress)
- 5 section status cards
- Quick action buttons
- Completion checklist per section

**Sections Monitored:**
1. Profile (avatar, name, phone)
2. Security (2FA, password, email verification)
3. Exchange (connected exchanges count)
4. Trading (risk settings, preferences)
5. Notifications (email, telegram, push)

## 📊 Components Details

### ProfileTab Component

**Location:** `/components/settings/ProfileTab.tsx`

**Features:**
- Avatar upload (coming soon)
- Full name
- Email (read-only)
- Phone number
- Bio/description
- Account type display

**API Endpoint:** `PUT /api/user/profile`

**State:**
```typescript
{
  name: string
  email: string
  phone: string
  bio: string
}
```

### SecurityTab Component

**Location:** `/components/settings/SecurityTab.tsx`

**Features:**
1. **Two-Factor Authentication (2FA)**
   - Enable/Disable toggle
   - QR code display for setup
   - Secret key display
   - 6-digit code verification
   - Backup codes generation
   - Status indicator

2. **Password Management**
   - Current password verification
   - New password (min 8 characters)
   - Password confirmation
   - Change password

**API Endpoints:**
- `GET /api/auth/2fa/status` - Check 2FA status
- `POST /api/auth/2fa/setup` - Generate QR code
- `POST /api/auth/2fa/verify` - Verify and enable
- `POST /api/auth/2fa/disable` - Disable 2FA
- `POST /api/auth/change-password` - Change password

**2FA Flow:**
```
1. User clicks "Enable 2FA"
2. Backend generates secret & QR code
3. User scans QR code with authenticator app
4. User enters 6-digit code
5. Backend verifies code
6. 2FA enabled + backup codes generated
7. User saves backup codes
```

### ExchangeTab Component

**Location:** `/components/settings/ExchangeTab.tsx`

**Functionality:** 
- Automatically redirects to `/cex-settings`
- Shows loading spinner during redirect

### TradingTab Component

**Location:** `/components/settings/TradingTab.tsx`

**Features:**
1. **Risk Management**
   - Risk level selection (Low/Medium/High)
   - Max concurrent positions (1-20)
   - Max leverage (1-125x)
   - Stop loss percentage (1-50%)
   - Take profit percentage (1-100%)

2. **Trading Features**
   - Auto trading toggle
   - Trailing stop loss toggle

3. **Risk Warning**
   - Display trading risk disclaimer

**API Endpoint:** 
- `GET /api/user/trading-config` - Fetch config
- `PUT /api/user/trading-config` - Update config

**State:**
```typescript
{
  riskLevel: 'low' | 'medium' | 'high'
  maxPositions: number
  maxLeverage: number
  stopLossPercentage: number
  takeProfitPercentage: number
  autoTrade: boolean
  trailingStop: boolean
}
```

### NotificationsTab Component

**Location:** `/components/settings/NotificationsTab.tsx`

**Features:**
1. **Email Notifications**
   - Enable/disable toggle
   - Trade execution alerts
   - Price alerts
   - Market news alerts
   - Weekly performance report

2. **Telegram Notifications**
   - Enable/disable toggle
   - Chat ID input
   - Trade execution alerts
   - Price alerts
   - Market news alerts
   - Bot setup instructions

3. **Push Notifications**
   - Coming soon indicator
   - Disabled by default

**API Endpoint:**
- `GET /api/user/notifications` - Fetch settings
- `PUT /api/user/notifications` - Update settings

**State:**
```typescript
{
  email: {
    enabled: boolean
    tradeAlerts: boolean
    priceAlerts: boolean
    newsAlerts: boolean
    weeklyReport: boolean
  }
  telegram: {
    enabled: boolean
    chatId: string
    tradeAlerts: boolean
    priceAlerts: boolean
    newsAlerts: boolean
  }
  push: {
    enabled: boolean
    tradeAlerts: boolean
    priceAlerts: boolean
  }
}
```

## 🔌 API Endpoints

### Settings Status API

**Endpoint:** `GET /api/settings/status`

**Authentication:** Required (NextAuth session)

**Response:**
```json
{
  "profile": {
    "completed": true,
    "avatar": true,
    "name": true,
    "phone": false
  },
  "security": {
    "completed": true,
    "twoFA": true,
    "passwordChanged": true,
    "emailVerified": true
  },
  "exchange": {
    "completed": true,
    "connected": 2,
    "verified": 2
  },
  "trading": {
    "completed": true,
    "riskSettings": true,
    "preferences": true
  },
  "notification": {
    "completed": true,
    "email": true,
    "telegram": true,
    "push": false
  }
}
```

**Calculation Logic:**
- **Profile:** Completed if avatar AND name exist
- **Security:** Completed if 2FA enabled AND email verified
- **Exchange:** Completed if at least 1 exchange connected and verified
- **Trading:** Completed if risk level AND max positions configured
- **Notification:** Completed if any notification channel enabled

## 🎨 Design System

### Color Scheme by Section:
- **Profile:** Blue gradient (`from-blue-500 to-cyan-500`)
- **Security:** Green gradient (`from-green-500 to-emerald-500`)
- **Exchange:** Yellow gradient (`from-yellow-500 to-orange-500`)
- **Trading:** Purple gradient (`from-purple-500 to-pink-500`)
- **Notifications:** Cyan gradient (`from-cyan-500 to-blue-500`)

### Status Colors:
- **Complete/Enabled:** Green (`text-green-400`, `bg-green-500/20`)
- **Incomplete/Disabled:** Red/Yellow/Orange
- **Pending:** Yellow (`text-yellow-400`)
- **Processing:** Blue (`text-blue-400`)

### Component States:
```css
Normal: bg-white/5 border border-white/10
Hover: hover:bg-white/10
Focus: focus:ring-2 focus:ring-blue-500
Active: bg-gradient-to-r from-blue-500 to-blue-600
Disabled: opacity-50 cursor-not-allowed
```

## 📱 Responsive Design

### Breakpoints:
- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (sm - lg)
- **Desktop:** > 1024px (lg)

### Layout Adaptations:
1. **Settings Page:**
   - Mobile: Single column, tabs at top
   - Desktop: Sidebar + content (grid-cols-[300px_1fr])

2. **Status Cards:**
   - Mobile: 1 column
   - Tablet: 2 columns
   - Desktop: 3 columns (5 cards total)

3. **Forms:**
   - Mobile: Full width inputs
   - Desktop: 2-column grid for related fields

## 🔒 Security Features

### Authentication:
- All settings pages require NextAuth session
- Redirect to `/login` if unauthenticated

### 2FA Implementation:
- Uses `speakeasy` library for TOTP
- QR code generated with `qrcode` library
- Backup codes stored encrypted
- 6-digit code verification
- Secret key shown for manual entry

### Password Security:
- Minimum 8 characters
- Current password required for change
- Confirmation required
- Bcrypt hashing

### API Security:
- Server-side session validation
- Input sanitization
- Rate limiting (recommended)
- CSRF protection via NextAuth

## 🚀 User Flows

### First-Time User Setup:
```
1. Register account
2. Verify email
3. Visit /check-settings
4. See low completion percentage
5. Click "Configure Profile"
6. Fill profile information
7. Enable 2FA (recommended)
8. Connect exchange
9. Set trading preferences
10. Configure notifications
11. Check status (should be 100%)
```

### Enabling 2FA:
```
1. /settings?tab=security
2. Click "Enable 2FA"
3. Scan QR code with authenticator app
   (Google Authenticator, Authy, etc.)
4. Enter 6-digit code
5. Save backup codes
6. 2FA enabled!
```

### Connecting Exchange:
```
1. /settings?tab=exchange
2. Auto-redirect to /cex-settings
3. Choose exchange (Binance, Bybit, etc.)
4. Enter API credentials
5. Set nickname
6. Test connection
7. Save
```

## 🐛 Troubleshooting

### Issue: Settings Status Not Updating
**Cause:** Cache not refreshed
**Solution:** 
1. Refresh the page
2. Click "Refresh Status" button
3. Clear browser cache

### Issue: 2FA QR Code Not Showing
**Cause:** API error or image loading issue
**Solution:**
1. Check console for errors
2. Try enabling again
3. Use manual secret key entry

### Issue: Cannot Save Trading Config
**Cause:** Validation error or unauthorized
**Solution:**
1. Check all fields are filled
2. Verify session is valid
3. Check browser console for errors

### Issue: Telegram Notifications Not Working
**Cause:** Incorrect Chat ID or bot not configured
**Solution:**
1. Message @FuturePilotBot on Telegram
2. Copy your Chat ID
3. Paste in settings
4. Enable Telegram notifications

## 📋 Todo / Future Enhancements

### High Priority:
- [ ] Avatar upload functionality
- [ ] Email change with verification
- [ ] Session management (view/revoke devices)
- [ ] Activity log
- [ ] Export user data

### Medium Priority:
- [ ] Custom notification schedules
- [ ] Advanced trading strategies
- [ ] Risk calculator
- [ ] Performance analytics
- [ ] API rate limits display

### Low Priority:
- [ ] Dark/light theme toggle
- [ ] Language selection
- [ ] Keyboard shortcuts
- [ ] Mobile app deep links
- [ ] Social media connections

## 🧪 Testing Checklist

### Settings Page (`/settings`):
- [ ] Tab navigation works
- [ ] URL updates with tab parameter
- [ ] Sidebar quick links work
- [ ] Mobile responsive
- [ ] Loading state shown
- [ ] Redirect to login when unauthenticated

### Profile Tab:
- [ ] Load current user data
- [ ] Update name, phone, bio
- [ ] Email field disabled
- [ ] Success message shown
- [ ] Error handling works

### Security Tab:
- [ ] Check 2FA status on load
- [ ] Enable 2FA shows QR code
- [ ] Verify code works
- [ ] Backup codes displayed
- [ ] Disable 2FA confirmation
- [ ] Change password validates input
- [ ] Password mismatch error shown

### Trading Tab:
- [ ] Load saved config
- [ ] Update risk settings
- [ ] Toggle switches work
- [ ] Validation for min/max values
- [ ] Warning message displayed

### Notifications Tab:
- [ ] Load saved preferences
- [ ] Toggle email notifications
- [ ] Toggle Telegram notifications
- [ ] Save Chat ID
- [ ] Push notifications disabled (coming soon)

### Check Settings Page:
- [ ] Load status from API
- [ ] Calculate completion percentage
- [ ] Display section cards correctly
- [ ] Status colors accurate
- [ ] Quick action buttons work
- [ ] Refresh button works

## 📞 Support

### For Users:
- Settings guide: `/docs/USER_SETTINGS_GUIDE.md`
- Video tutorial: (link to be added)
- FAQ: (link to be added)

### For Developers:
- API documentation: This file
- Component docs: Inline JSDoc comments
- Testing guide: `/docs/TESTING_SETTINGS.md` (to be created)

---

**Version:** 1.0.0  
**Last Updated:** October 24, 2025  
**Author:** FuturePilot Development Team
