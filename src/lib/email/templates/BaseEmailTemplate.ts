/**
 * Base Email Template for FuturePilot
 * Professional HTML email with inline CSS for maximum compatibility
 */

interface BaseEmailProps {
  previewText: string;
  title: string;
  content: string;
  ctaText?: string;
  ctaUrl?: string;
  footerText?: string;
}

export function generateBaseEmailTemplate({
  previewText,
  title,
  content,
  ctaText,
  ctaUrl,
  footerText = 'If you did not request this action, please contact our support team immediately.'
}: BaseEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f4f4f4;
    }
    .email-wrapper {
      width: 100%;
      background-color: #f4f4f4;
      padding: 20px 0;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 30px 20px;
      text-align: center;
    }
    .email-logo {
      font-size: 32px;
      font-weight: bold;
      color: #ffffff;
      text-decoration: none;
      display: inline-block;
    }
    .email-logo-icon {
      font-size: 40px;
      margin-bottom: 10px;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-title {
      font-size: 24px;
      font-weight: bold;
      color: #1a202c;
      margin-bottom: 20px;
      text-align: center;
    }
    .email-content {
      font-size: 16px;
      color: #4a5568;
      line-height: 1.8;
      margin-bottom: 30px;
    }
    .email-content p {
      margin-bottom: 15px;
    }
    .email-cta {
      text-align: center;
      margin: 30px 0;
    }
    .email-button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    .email-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .email-info-box {
      background-color: #f7fafc;
      border-left: 4px solid #667eea;
      padding: 15px 20px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .email-footer {
      background-color: #1a202c;
      color: #cbd5e0;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .email-footer-links {
      margin: 15px 0;
    }
    .email-footer-link {
      color: #667eea;
      text-decoration: none;
      margin: 0 10px;
    }
    .email-footer-link:hover {
      text-decoration: underline;
    }
    .email-social {
      margin: 20px 0;
    }
    .email-social a {
      display: inline-block;
      margin: 0 8px;
      color: #cbd5e0;
      text-decoration: none;
    }
    .email-divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 25px 0;
    }
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: 0 !important;
        border-radius: 0 !important;
      }
      .email-body {
        padding: 30px 20px !important;
      }
      .email-title {
        font-size: 20px !important;
      }
      .email-content {
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body>
  <!-- Preview Text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${previewText}
  </div>

  <div class="email-wrapper">
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <div class="email-logo-icon">🚀</div>
        <a href="https://futurepilot.pro" class="email-logo">FuturePilot</a>
        <div style="color: rgba(255,255,255,0.8); font-size: 14px; margin-top: 8px;">
          Automated Trading Platform
        </div>
      </div>

      <!-- Body -->
      <div class="email-body">
        <h1 class="email-title">${title}</h1>
        
        <div class="email-content">
          ${content}
        </div>

        ${ctaText && ctaUrl ? `
        <div class="email-cta">
          <a href="${ctaUrl}" class="email-button">${ctaText}</a>
        </div>
        ` : ''}

        ${footerText ? `
        <div class="email-divider"></div>
        <div style="font-size: 14px; color: #718096; text-align: center;">
          ${footerText}
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="email-footer">
        <div style="margin-bottom: 15px;">
          <strong style="color: #ffffff;">FuturePilot</strong> - Your Automated Trading Partner
        </div>
        
        <div class="email-footer-links">
          <a href="https://futurepilot.pro" class="email-footer-link">Website</a>
          <span style="color: #4a5568;">|</span>
          <a href="https://futurepilot.pro/docs" class="email-footer-link">Documentation</a>
          <span style="color: #4a5568;">|</span>
          <a href="https://futurepilot.pro/support" class="email-footer-link">Support</a>
        </div>

        <div class="email-social">
          <a href="https://twitter.com/futurepilot" title="Twitter">🐦</a>
          <a href="https://t.me/futurepilot" title="Telegram">✈️</a>
          <a href="https://discord.gg/futurepilot" title="Discord">💬</a>
        </div>

        <div style="margin-top: 20px; font-size: 12px; color: #718096;">
          © ${new Date().getFullYear()} FuturePilot. All rights reserved.<br>
          This email was sent to you as a registered user of FuturePilot.
        </div>

        <div style="margin-top: 15px; font-size: 11px; color: #4a5568;">
          <a href="https://futurepilot.pro/unsubscribe" style="color: #4a5568; text-decoration: underline;">Unsubscribe</a> | 
          <a href="https://futurepilot.pro/privacy" style="color: #4a5568; text-decoration: underline;">Privacy Policy</a>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
