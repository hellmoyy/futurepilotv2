# Email Verification Setup

This project uses [Resend](https://resend.com) for sending verification emails.

## Setup Instructions

1. **Create a Resend Account**
   - Go to [resend.com](https://resend.com)
   - Sign up for a free account
   - Free tier includes: 3,000 emails/month, 100 emails/day

2. **Get Your API Key**
   - After signing up, go to [API Keys](https://resend.com/api-keys)
   - Click "Create API Key"
   - Give it a name (e.g., "FuturePilot Dev")
   - Copy the API key

3. **Add to Environment Variables**
   - Open your `.env` file
   - Add: `RESEND_API_KEY=re_your_api_key_here`

4. **Test Email Verification**
   - Register a new user
   - Check your email inbox for verification link
   - Click the link to verify your account

## Email Flow

1. User registers → Verification email sent
2. User clicks link in email → Redirected to `/verify-email?token=xxx`
3. Token validated → Account verified
4. User can now sign in

## Customization

To customize the verification email template, edit:
```
src/lib/resend.ts
```

The email uses inline styles for maximum compatibility across email clients.

## Testing in Development

During development, you can use your own email address to test the verification flow. Resend's free tier is perfect for development and testing.

## Production Notes

- For production, consider using a custom domain with Resend
- Monitor your email sending limits
- Set up proper error handling and logging
- Consider adding email retry logic for failed sends
