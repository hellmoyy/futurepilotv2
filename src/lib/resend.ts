import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not defined in environment variables');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'FuturePilot <noreply@mail.futurepilot.pro>',
      to: email,
      subject: 'Verify your email address',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #000000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #000000; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(to bottom right, rgba(59, 130, 246, 0.05), rgba(6, 182, 212, 0.05)); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 40px;">
                    <!-- Logo -->
                    <tr>
                      <td align="center" style="padding-bottom: 32px;">
                        <img src="https://futurepilot.pro/images/logos/logo-dark.png" alt="FuturePilot" style="height: 40px; width: auto;" />
                      </td>
                    </tr>
                    
                    <!-- Title -->
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #ffffff;">
                          Verify Your Email
                        </h1>
                      </td>
                    </tr>
                    
                    <!-- Message -->
                    <tr>
                      <td align="center" style="padding-bottom: 32px;">
                        <p style="margin: 0; font-size: 16px; line-height: 24px; color: #d1d5db;">
                          Thanks for signing up! Please verify your email address to get started with FuturePilot.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Button -->
                    <tr>
                      <td align="center" style="padding-bottom: 32px;">
                        <a href="${verificationUrl}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(to right, #3b82f6, #2563eb); color: white; text-decoration: none; border-radius: 16px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(59, 130, 246, 0.3);">
                          Verify Email Address
                        </a>
                      </td>
                    </tr>
                    
                    <!-- Alternative Link -->
                    <tr>
                      <td align="center" style="padding-bottom: 16px;">
                        <p style="margin: 0; font-size: 14px; color: #9ca3af;">
                          Or copy and paste this link into your browser:
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-bottom: 32px;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280; word-break: break-all;">
                          ${verificationUrl}
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td align="center" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 24px;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280;">
                          This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top: 16px;">
                        <p style="margin: 0; font-size: 12px; color: #6b7280;">
                          © 2024 FuturePilot. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error };
    }

    console.log('Verification email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return { success: false, error };
  }
}
