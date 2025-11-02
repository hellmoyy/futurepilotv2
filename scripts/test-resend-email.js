#!/usr/bin/env node

/**
 * Test Resend Email Script
 * Test sending emails via Resend API
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in .env.local');
  process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);

async function testEmail() {
  console.log('🧪 Testing Resend Email Service...\n');
  
  try {
    console.log('📧 Sending test email...');
    
    const { data, error } = await resend.emails.send({
      from: 'FuturePilot <noreply@mail.futurepilot.pro>',
      to: 'helmi.andito@gmail.com',
      subject: '✅ Test Email from FuturePilot Notification System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Test Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; padding: 40px; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 8px;">
            <h1 style="color: #667eea;">✅ Resend Email Service Working!</h1>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              This is a test email from FuturePilot Notification System.
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              If you received this email, it means Resend integration is working correctly! 🎉
            </p>
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            <p style="color: #999; font-size: 14px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📬 Email ID:', data?.id);
    console.log('\n📥 Check your inbox: helmi.andito@gmail.com');
    
  } catch (error) {
    console.error('❌ Failed to send email:', error);
  }
}

testEmail();
