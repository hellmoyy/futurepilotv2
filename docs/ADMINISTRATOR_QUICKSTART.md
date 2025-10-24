# Administrator Quick Start

## Access

🔗 **URL**: http://localhost:3001/administrator

## Default Credentials

```
Email: admin@futurepilot.pro
Password: pisanggoreng
```

⚠️ **Change password in production!**

## Setup

1. Add to `.env.local`:
```bash
ADMIN_EMAIL=admin@futurepilot.pro
ADMIN_PASSWORD=pisanggoreng
```

2. Restart dev server:
```bash
npm run dev
```

3. Login at: http://localhost:3001/administrator

## Features

✅ Separate authentication from regular users  
✅ JWT-based session (8 hours)  
✅ Secure HTTP-only cookies  
✅ Dashboard interface  
🔄 User management (coming soon)  
🔄 Withdrawal approval (coming soon)  
🔄 Analytics (coming soon)  

## Security

- Environment-based credentials
- HTTP-only cookies
- Path-restricted tokens
- Auto-logout after 8 hours

## Documentation

See full documentation: [ADMINISTRATOR_SYSTEM.md](./ADMINISTRATOR_SYSTEM.md)
