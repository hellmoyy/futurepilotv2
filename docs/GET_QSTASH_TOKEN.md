# 🚀 Get Your Upstash QStash Token (2 Minutes)

## Quick Steps:

### 1. Login to Upstash (1 minute)

Go to: **https://console.upstash.com**

- If you have account: Login
- If no account: Sign up (free, no credit card needed)

### 2. Navigate to QStash (30 seconds)

- Click **"QStash"** in the sidebar
- Or go directly: **https://console.upstash.com/qstash**

### 3. Copy Your Token (30 seconds)

You'll see two tokens:

```
QSTASH_TOKEN=ey...         ← Copy this one!
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...
```

**Copy the QSTASH_TOKEN** (starts with `ey...`)

### 4. Add to .env.local

Open `/Users/hap/Documents/CODE-MASTER/futurepilotv2/.env.local`

Add this line:

```bash
QSTASH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your-token-here
```

---

## ✅ Then Run Setup Script:

```bash
node scripts/setup-upstash-balance-check.js
```

---

## 🎯 What You Get (Free Tier):

- ✅ 500 requests/day
- ✅ Unlimited schedules
- ✅ 7-day log retention
- ✅ No credit card required

**For balance check cron (24 requests/day):** FREE FOREVER ✅

---

## 📸 Screenshot Reference:

When you're on QStash page, you'll see:

```
┌─────────────────────────────────────┐
│ QStash                              │
├─────────────────────────────────────┤
│                                     │
│ 📋 API Keys                         │
│                                     │
│ QSTASH_TOKEN                        │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6I...   │
│ [Copy] ← Click this button          │
│                                     │
│ QSTASH_CURRENT_SIGNING_KEY          │
│ sig_...                             │
│                                     │
│ QSTASH_NEXT_SIGNING_KEY             │
│ sig_...                             │
│                                     │
└─────────────────────────────────────┘
```

Copy the **QSTASH_TOKEN** only!

---

## 🔗 Direct Links:

- **QStash Console:** https://console.upstash.com/qstash
- **Sign Up:** https://console.upstash.com/login
- **Docs:** https://upstash.com/docs/qstash

---

**Status:** Ready in 2 minutes! 🚀
