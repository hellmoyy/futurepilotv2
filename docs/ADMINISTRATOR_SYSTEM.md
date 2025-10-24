# Administrator System Documentation

## Overview

FuturePilot includes a separate administrator authentication system independent from regular user authentication. This allows platform administrators to access privileged features without interfering with the user authentication flow.

## Features

✅ **Separate Authentication System**
- Independent from NextAuth user authentication
- JWT-based session management
- HTTP-only cookies for security
- 8-hour session expiration

✅ **Login-Only Access**
- No registration endpoint
- Credentials stored in environment variables
- Admin access restricted to configured email

✅ **Dashboard Interface**
- Modern, responsive design
- Quick stats overview
- Activity monitoring (coming soon)
- User management tools (coming soon)

## Setup

### 1. Environment Variables

Add these credentials to your `.env.local` file:

```bash
# Administrator Credentials
ADMIN_EMAIL=admin@futurepilot.pro
ADMIN_PASSWORD=pisanggoreng
```

⚠️ **Important**: Change the default password immediately in production!

### 2. Access

Navigate to the administrator login page:

```
http://localhost:3001/administrator
```

Default credentials:
- **Email**: admin@futurepilot.pro
- **Password**: pisanggoreng

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       ├── login/
│   │       │   └── route.ts          # Admin login endpoint
│   │       ├── logout/
│   │       │   └── route.ts          # Admin logout endpoint
│   │       └── verify/
│   │           └── route.ts          # Session verification
│   └── administrator/
│       ├── page.tsx                  # Login page
│       └── dashboard/
│           └── page.tsx              # Admin dashboard
└── lib/
    └── adminAuth.ts                  # Authentication utilities
```

## API Endpoints

### POST /api/admin/login

Authenticate administrator and create session.

**Request:**
```json
{
  "email": "admin@futurepilot.pro",
  "password": "pisanggoreng"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "admin": {
    "email": "admin@futurepilot.pro",
    "role": "admin"
  }
}
```

**Sets Cookie:**
- `admin-token`: JWT token with 8-hour expiration
- `httpOnly`: true
- `path`: /administrator

### POST /api/admin/logout

Clear admin session.

**Response:**
```json
{
  "success": true,
  "message": "Admin logout successful"
}
```

### GET /api/admin/verify

Verify current admin session.

**Response (Authenticated):**
```json
{
  "authenticated": true,
  "admin": {
    "email": "admin@futurepilot.pro",
    "role": "admin",
    "loginTime": "2025-10-24T10:00:00.000Z"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "authenticated": false
}
```
Status: 401

## Security Features

### 1. JWT Authentication
- Tokens signed with `NEXTAUTH_SECRET`
- 8-hour expiration time
- Stored in HTTP-only cookies

### 2. Path Restriction
- Admin cookies scoped to `/administrator` path
- Cannot interfere with user sessions

### 3. Environment-Based Credentials
- No hardcoded credentials
- Easy credential rotation
- Separate from user database

### 4. Session Verification
- Every admin page verifies authentication
- Automatic redirect to login if not authenticated
- Token validation on each request

## Authentication Flow

```
┌─────────────────┐
│  Admin visits   │
│ /administrator  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Login Page     │
│  Enter email    │
│  & password     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /api/admin │
│     /login      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify against  │
│ ADMIN_EMAIL &   │
│ ADMIN_PASSWORD  │
└────────┬────────┘
         │
         ├─── Invalid ───┐
         │               │
         │               ▼
         │         Return 401
         │         Show error
         │
         └─── Valid ─────┐
                         │
                         ▼
                   ┌─────────────┐
                   │ Create JWT  │
                   │ Set Cookie  │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  Redirect   │
                   │ /dashboard  │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ Verify auth │
                   │ on each load│
                   └─────────────┘
```

## Dashboard Features

### Current Features

1. **Header**
   - Admin email display
   - Role indicator
   - Logout button

2. **Welcome Section**
   - Personalized greeting
   - Quick overview

3. **Stats Grid** (Coming Soon)
   - Total Users
   - Active Referrals
   - Total Commissions
   - Pending Withdrawals

4. **Quick Actions** (Coming Soon)
   - Manage Users
   - Approve Withdrawals
   - View Analytics

5. **Recent Activity** (Coming Soon)
   - Activity logs
   - User actions
   - System events

### Planned Features

- [ ] User Management Dashboard
- [ ] Referral Commission Approval
- [ ] Withdrawal Request Management
- [ ] Platform Analytics
- [ ] System Configuration
- [ ] Activity Logs
- [ ] Email Management
- [ ] API Key Management

## Adding New Admin Features

### 1. Create Protected API Endpoint

```typescript
// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = process.env.NEXTAUTH_SECRET || 'fallback-secret-key';
    const decoded = verify(token, secret) as any;

    if (decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Your admin logic here
    // ...

    return NextResponse.json({ success: true, data: [] });
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### 2. Add Dashboard Component

```typescript
// In dashboard/page.tsx
const fetchUsers = async () => {
  const response = await fetch('/api/admin/users');
  const data = await response.json();
  // Update state...
};
```

## Best Practices

### 1. Change Default Password
Always change the default password in production:
```bash
ADMIN_PASSWORD=your-secure-password-here
```

### 2. Use Strong Passwords
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, symbols
- Avoid dictionary words

### 3. Rotate Credentials Regularly
Update admin credentials periodically:
1. Update `.env.local`
2. Restart server
3. All active sessions invalidated

### 4. Monitor Admin Activity
- Log all admin actions
- Track login attempts
- Alert on suspicious activity

### 5. Secure Environment Variables
- Never commit `.env.local` to git
- Use secrets management in production
- Restrict access to environment variables

## Production Deployment

### Railway / Heroku / VPS

1. Set environment variables in platform dashboard:
```bash
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-secure-password
```

2. Ensure `NEXTAUTH_SECRET` is set
3. Deploy application
4. Access at: `https://yourdomain.com/administrator`

### Vercel

1. Go to Project Settings → Environment Variables
2. Add:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
3. Redeploy
4. Access at: `https://yourdomain.vercel.app/administrator`

## Troubleshooting

### Cannot Login

**Issue**: "Invalid credentials" error

**Solutions**:
1. Check environment variables are set correctly
2. Restart development server
3. Clear browser cookies
4. Verify email and password match exactly

### Session Expired

**Issue**: Redirected to login after some time

**Solutions**:
- This is expected after 8 hours
- Simply login again
- Adjust token expiration in `/api/admin/login/route.ts` if needed:
  ```typescript
  { expiresIn: '24h' } // Change to desired duration
  ```

### Cannot Access Dashboard

**Issue**: Stuck on login page or 401 errors

**Solutions**:
1. Check browser console for errors
2. Verify JWT token is being set (check cookies)
3. Ensure `NEXTAUTH_SECRET` is configured
4. Check server logs for authentication errors

## Security Considerations

### 1. Never Expose Credentials
- Don't log passwords
- Don't send passwords in URLs
- Don't store in frontend code

### 2. Use HTTPS in Production
Admin cookies should only transmit over HTTPS:
```typescript
secure: process.env.NODE_ENV === 'production'
```

### 3. Rate Limiting
Consider adding rate limiting to prevent brute force:
```typescript
// Add rate limiter middleware
const loginAttempts = new Map();
```

### 4. Two-Factor Authentication (Future)
Consider implementing 2FA for additional security.

### 5. IP Whitelisting (Optional)
Restrict admin access to specific IP addresses.

## Maintenance

### Regular Tasks

1. **Weekly**: Review admin activity logs
2. **Monthly**: Rotate admin password
3. **Quarterly**: Review and update security measures
4. **As Needed**: Update admin features

### Monitoring

Monitor these metrics:
- Failed login attempts
- Active admin sessions
- Admin actions performed
- System changes made

## Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Check browser console
4. Verify environment configuration

## Changelog

### Version 1.0.0 (2025-10-24)
- Initial administrator system implementation
- Login page with secure authentication
- Basic dashboard interface
- JWT-based session management
- Environment-based credential storage
