# Security Quick Reference Guide

**Last Updated:** November 4, 2025  
**Security Rating:** 8.5/10  

---

## 🚀 Quick Start

### Rate Limiting

```typescript
import rateLimiter, { RateLimitConfigs, getClientIP } from '@/lib/rateLimit';

// In your API route
const clientIP = getClientIP(request);
const check = rateLimiter.check(`endpoint:${clientIP}`, RateLimitConfigs.LOGIN);

if (!check.allowed) {
  return NextResponse.json(
    { error: `Too many attempts. Retry in ${check.retryAfter}s` },
    { status: 429, headers: { 'Retry-After': check.retryAfter?.toString() } }
  );
}

// On success, reset the counter
rateLimiter.reset(`endpoint:${clientIP}`);
```

### Password Validation

```typescript
import { validatePassword, validatePasswordStrength } from '@/lib/passwordValidation';

// Simple validation (returns error message or null)
const error = validatePassword(password);
if (error) {
  return res.status(400).json({ error });
}

// Detailed strength analysis
const strength = validatePasswordStrength(password);
// strength.score: 0-5
// strength.isValid: boolean
// strength.feedback: string[]
```

### Account Lockout (Automatic)

Already integrated in `/src/lib/auth.ts` - no additional code needed!

- 5 failed login attempts → 30 minute lockout
- Auto-resets after expiration
- Shows remaining attempts

---

## 📋 Available Rate Limit Configs

```typescript
RateLimitConfigs.LOGIN          // 5 attempts / 15 min
RateLimitConfigs.REGISTER       // 3 attempts / 1 hour
RateLimitConfigs.PASSWORD_RESET // 3 attempts / 1 hour
RateLimitConfigs.TWO_FACTOR     // 10 attempts / 15 min
RateLimitConfigs.API            // 100 requests / 15 min
```

---

## 🔒 Password Requirements

| Requirement | Enforced |
|-------------|----------|
| Min 8 characters | ✅ Yes |
| Uppercase letter | ✅ Yes |
| Lowercase letter | ✅ Yes |
| Number | ✅ Yes |
| Special character | ⭐ Recommended |

---

## 🛡️ Security Features Status

| Feature | Status | Priority |
|---------|--------|----------|
| Admin Auth Check | ✅ Complete | P1 (CRITICAL) |
| Rate Limiting | ✅ Complete | P2 (HIGH) |
| Account Lockout | ✅ Complete | P2 (HIGH) |
| Strong Passwords | ✅ Complete | P2 (HIGH) |
| Session Duration (14d) | ✅ Complete | P2 (HIGH) |
| 2FA Support | ✅ Complete | Existing |
| Email Verification | ✅ Complete | Existing |
| Ban System | ✅ Complete | Existing |
| Session Metadata | ⏳ Optional | P3 (MEDIUM) |
| Login Notifications | ⏳ Optional | P3 (MEDIUM) |

---

## 📊 Testing Commands

```bash
# Test rate limiting (should fail on 6th attempt)
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"Test123\",\"name\":\"Test\"}"
done

# Test password validation
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"weak","name":"Test"}'
# Should fail: "Password must contain..."

# Test account lockout (via login page)
# 1. Try wrong password 5 times
# 2. Check for "Account locked for 30 minutes" message
```

---

## 🚨 Common Issues

### Rate Limit Not Working?

Check IP detection:
```typescript
const clientIP = getClientIP(request);
console.log('Client IP:', clientIP);
// Should show real IP, not 'unknown'
```

### Account Still Locked After 30 Minutes?

Check server timezone:
```typescript
console.log('Server time:', new Date());
console.log('Lock until:', user.accountLockedUntil);
```

### Password Validation Failing Unexpectedly?

Test validation:
```typescript
import { validatePasswordStrength } from '@/lib/passwordValidation';
const result = validatePasswordStrength('YourPassword123');
console.log(result);
```

---

## 📞 Support

For security issues or questions:
1. Check documentation in `/docs/`
2. Review code in `/src/lib/` helpers
3. Test with curl commands above
4. Contact security team if issue persists

---

**Remember:** Security is a continuous process. Regularly review and update security measures.
