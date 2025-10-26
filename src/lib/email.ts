// Email service utility
// For now, we'll use console logging as placeholder for email sending
// In production, you should integrate with a proper email service like:
// - Nodemailer with SMTP
// - SendGrid
// - AWS SES
// - Mailgun

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
  
  // For development/demo purposes, log the email content
  console.log('\n=== PASSWORD RESET EMAIL ===');
  console.log(`To: ${email}`);
  console.log(`Subject: Reset Your Password - FuturePilot`);
  console.log(`Reset URL: ${resetUrl}`);
  console.log('Content:');
  console.log(`Hello ${name},`);
  console.log('We received a request to reset your password for your FuturePilot account.');
  console.log(`Please click this link to reset your password: ${resetUrl}`);
  console.log('This link will expire in 10 minutes.');
  console.log('If you didn\'t request this reset, you can safely ignore this email.');
  console.log('============================\n');

  // In production, replace this with actual email sending
  // Example with nodemailer:
  /*
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"FuturePilot" <${process.env.SMTP_FROM}>`,
    to: email,
    subject: 'Reset Your Password - FuturePilot',
    html: emailTemplate,
    text: textVersion,
  };

  */

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return Promise.resolve({
    messageId: `fake-message-id-${Date.now()}`,
    envelope: { from: 'noreply@futurepilot.pro', to: [email] },
    accepted: [email],
    rejected: [],
    pending: [],
    response: '250 OK: Message queued'
  });
}

export async function sendVerificationEmail(email: string, name: string, verificationToken: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`;
  
  // For development/demo purposes, log the email content
  console.log('\n=== EMAIL VERIFICATION EMAIL ===');
  console.log(`To: ${email}`);
  console.log(`Subject: Verify Your Email - FuturePilot`);
  console.log(`Verification URL: ${verificationUrl}`);
  console.log('Content:');
  console.log(`Hello ${name},`);
  console.log('Welcome to FuturePilot! Please verify your email address.');
  console.log(`Please click this link to verify: ${verificationUrl}`);
  console.log('This link will expire in 24 hours.');
  console.log('================================\n');

  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return Promise.resolve({
    messageId: `fake-message-id-${Date.now()}`,
    envelope: { from: 'noreply@futurepilot.pro', to: [email] },
    accepted: [email],
    rejected: [],
    pending: [],
    response: '250 OK: Message queued'
  });
}