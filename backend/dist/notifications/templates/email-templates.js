"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmailVerificationTemplate = renderEmailVerificationTemplate;
exports.renderPasswordResetTemplate = renderPasswordResetTemplate;
function renderEmailVerificationTemplate(opts) {
    const senderEmail = opts.senderEmail || 'info@aurikrex.com';
    const supportEmail = opts.supportEmail || 'info@aurikrex.com';
    const firstName = opts.fullName?.split(' ')[0] || 'Candidate';
    const year = new Date().getFullYear();
    const text = `Hi ${firstName},

Welcome to Aurikrex Exam Arena! Please verify your email address to activate your account and start your JAMB UTME preparation.

Click the link below to verify your email address:
${opts.verificationUrl}

Or enter your 6-digit verification code if prompted:
${opts.code}

This link and code will expire in 24 hours.

If you didn't create an account with Aurikrex Exam Arena, you can safely ignore this email.

Best regards,
The Aurikrex Team
${senderEmail}
`;
    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Verify your email address - Aurikrex Exam Arena</title>
  <!--[if mso]>
  <style>
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b1120;
      color: #0f172a;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 44px 40px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #2563eb;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 9999px;
      padding: 4px 12px;
    }
    .btn-primary {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      line-height: 1;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 10px;
      text-align: center;
      transition: background-color 0.2s;
    }
    .code-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      font-family: 'SF Mono', SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.35em;
      color: #0f172a;
    }
    .footer-text {
      font-size: 12px;
      line-height: 1.6;
      color: #64748b;
      text-align: center;
    }
    .footer-link {
      color: #64748b;
      text-decoration: underline;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #050814 !important;
      }
      .card {
        background-color: #0b1120 !important;
        border-color: #1e293b !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
      }
      .heading {
        color: #f8fafc !important;
      }
      .text-body {
        color: #cbd5e1 !important;
      }
      .code-box {
        background-color: #131d35 !important;
        border-color: #334155 !important;
        color: #f1f5f9 !important;
      }
      .alt-link-box {
        background-color: #0f172a !important;
        border-color: #1e293b !important;
      }
      .footer-text {
        color: #94a3b8 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120;">
  <center style="width: 100%; table-layout: fixed; background-color: #0b1120; padding: 32px 0;">
    <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Brand Header -->
      <table role="presentation" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td align="left" style="vertical-align: middle;">
            <table role="presentation" style="display: inline-table;">
              <tr>
                <td style="vertical-align: middle; padding-right: 12px;">
                  <div style="background-color: #2563eb; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; color: #ffffff; font-weight: 800; font-size: 18px;">
                    A
                  </div>
                </td>
                <td style="vertical-align: middle;">
                  <span style="font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">Aurikrex</span>
                  <span style="font-size: 13px; font-weight: 500; color: #94a3b8; margin-left: 6px;">Exam Arena</span>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" style="vertical-align: middle;">
            <span class="badge" style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #60a5fa; background-color: rgba(37, 99, 235, 0.15); border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 9999px; padding: 4px 12px;">JAMB UTME CBT</span>
          </td>
        </tr>
      </table>

      <!-- Main Card -->
      <table role="presentation" width="100%" class="card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 44px 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
        <tr>
          <td>
            <h1 class="heading" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; line-height: 1.3;">
              Confirm your email address
            </h1>
            
            <p class="text-body" style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">
              Hi <strong>${firstName}</strong>,
            </p>
            <p class="text-body" style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #334155;">
              Welcome to <strong>Aurikrex Exam Arena</strong>! Tap the button below to confirm your email and activate your candidate profile for real UTME mock simulations, diagnostic analytics, and Falke AI assistance.
            </p>

            <!-- CTA Button -->
            <table role="presentation" width="100%" style="margin: 32px 0 28px 0;">
              <tr>
                <td align="center">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${opts.verificationUrl}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="20%" stroke="f" fillcolor="#2563eb">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Verify Email Address</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-- -->
                  <a href="${opts.verificationUrl}" target="_blank" class="btn-primary" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 15px 36px; border-radius: 10px; text-align: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                    Verify Email Address
                  </a>
                  <!--<![endif]-->
                </td>
              </tr>
            </table>

            <!-- 6-digit Code Alternative -->
            <div style="margin: 32px 0 24px 0; text-align: center;">
              <p class="text-body" style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                Or enter this 6-digit verification code:
              </p>
              <div class="code-box" style="display: inline-block; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 28px; font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-size: 26px; font-weight: 700; letter-spacing: 0.3em; color: #0f172a;">
                ${opts.code}
              </div>
            </div>

            <div style="height: 1px; background-color: #e2e8f0; margin: 32px 0 24px 0;"></div>

            <!-- Alternative URL Copy Box -->
            <div class="alt-link-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                Link not opening? Copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                <a href="${opts.verificationUrl}" style="color: #2563eb; text-decoration: underline;">${opts.verificationUrl}</a>
              </p>
            </div>

            <!-- Expiry & Security Notice -->
            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #64748b;">
              This verification link and code will expire in <strong>24 hours</strong>. If you did not create an Aurikrex Exam Arena account, you can safely ignore this email.
            </p>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="100%" style="margin-top: 28px;">
        <tr>
          <td align="center">
            <p class="footer-text" style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              Sent by <strong style="color: #cbd5e1;">${senderEmail}</strong> to <span style="color: #cbd5e1;">${opts.fullName}</span>
            </p>
            <p class="footer-text" style="margin: 0 0 12px 0; font-size: 11px; color: #64748b;">
              Aurikrex Inc. • 12, Montgomery Road, Yaba, Lagos, Nigeria
            </p>
            <p class="footer-text" style="margin: 0; font-size: 11px; color: #64748b;">
              <a href="https://www.aurikrex.com" class="footer-link" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Website</a> •
              <a href="https://cbt.aurikrex.com/terms" class="footer-link" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Terms of Service</a> •
              <a href="https://cbt.aurikrex.com/privacy" class="footer-link" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Privacy Policy</a> •
              <a href="mailto:${supportEmail}" class="footer-link" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Support</a>
            </p>
            <p class="footer-text" style="margin: 12px 0 0 0; font-size: 11px; color: #475569;">
              &copy; ${year} Aurikrex. All rights reserved.
            </p>
          </td>
        </tr>
      </table>

    </div>
  </center>
</body>
</html>`;
    return { text, html };
}
function renderPasswordResetTemplate(opts) {
    const senderEmail = opts.senderEmail || 'info@aurikrex.com';
    const supportEmail = opts.supportEmail || 'info@aurikrex.com';
    const firstName = opts.fullName?.split(' ')[0] || 'Candidate';
    const year = new Date().getFullYear();
    const text = `Hi ${firstName},

We received a request to reset the password for your Aurikrex Exam Arena account.

Click the link below to set a new password:
${opts.resetUrl}

Or enter your 6-digit recovery code if prompted:
${opts.code}

This recovery code expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The Aurikrex Team
${senderEmail}
`;
    const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset your password - Aurikrex Exam Arena</title>
  <!--[if mso]>
  <style>
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      -webkit-text-size-adjust: 100% !important;
      -ms-text-size-adjust: 100% !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #0b1120;
      color: #0f172a;
    }
    table {
      border-spacing: 0;
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 44px 40px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
    }
    .badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #dc2626;
      background-color: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 9999px;
      padding: 4px 12px;
    }
    .btn-primary {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      font-size: 15px;
      font-weight: 600;
      line-height: 1;
      text-decoration: none;
      padding: 16px 36px;
      border-radius: 10px;
      text-align: center;
      transition: background-color 0.2s;
    }
    .code-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
      font-family: 'SF Mono', SFMono-Regular, ui-monospace, Menlo, Monaco, Consolas, monospace;
      font-size: 28px;
      font-weight: 700;
      letter-spacing: 0.35em;
      color: #0f172a;
    }
    .footer-text {
      font-size: 12px;
      line-height: 1.6;
      color: #64748b;
      text-align: center;
    }
    .footer-link {
      color: #64748b;
      text-decoration: underline;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #050814 !important;
      }
      .card {
        background-color: #0b1120 !important;
        border-color: #1e293b !important;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5) !important;
      }
      .heading {
        color: #f8fafc !important;
      }
      .text-body {
        color: #cbd5e1 !important;
      }
      .code-box {
        background-color: #131d35 !important;
        border-color: #334155 !important;
        color: #f1f5f9 !important;
      }
      .alt-link-box {
        background-color: #0f172a !important;
        border-color: #1e293b !important;
      }
      .footer-text {
        color: #94a3b8 !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0b1120;">
  <center style="width: 100%; table-layout: fixed; background-color: #0b1120; padding: 32px 0;">
    <div class="email-container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Brand Header -->
      <table role="presentation" width="100%" style="margin-bottom: 24px;">
        <tr>
          <td align="left" style="vertical-align: middle;">
            <table role="presentation" style="display: inline-table;">
              <tr>
                <td style="vertical-align: middle; padding-right: 12px;">
                  <div style="background-color: #2563eb; width: 36px; height: 36px; border-radius: 8px; text-align: center; line-height: 36px; color: #ffffff; font-weight: 800; font-size: 18px;">
                    A
                  </div>
                </td>
                <td style="vertical-align: middle;">
                  <span style="font-size: 18px; font-weight: 700; color: #ffffff; letter-spacing: -0.01em;">Aurikrex</span>
                  <span style="font-size: 13px; font-weight: 500; color: #94a3b8; margin-left: 6px;">Exam Arena</span>
                </td>
              </tr>
            </table>
          </td>
          <td align="right" style="vertical-align: middle;">
            <span class="badge" style="font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #f87171; background-color: rgba(239, 68, 68, 0.15); border: 1px solid rgba(248, 113, 113, 0.3); border-radius: 9999px; padding: 4px 12px;">Security</span>
          </td>
        </tr>
      </table>

      <!-- Main Card -->
      <table role="presentation" width="100%" class="card" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 44px 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
        <tr>
          <td>
            <h1 class="heading" style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; color: #0f172a; line-height: 1.3;">
              Reset your password
            </h1>
            
            <p class="text-body" style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #334155;">
              Hi <strong>${firstName}</strong>,
            </p>
            <p class="text-body" style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #334155;">
              We received a request to reset the password for your Aurikrex Exam Arena candidate account. Click the button below to choose a new password.
            </p>

            <!-- CTA Button -->
            <table role="presentation" width="100%" style="margin: 32px 0 28px 0;">
              <tr>
                <td align="center">
                  <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${opts.resetUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="20%" stroke="f" fillcolor="#2563eb">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Reset Password</center>
                  </v:roundrect>
                  <![endif]-->
                  <!--[if !mso]><!-- -->
                  <a href="${opts.resetUrl}" target="_blank" class="btn-primary" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; padding: 15px 36px; border-radius: 10px; text-align: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
                    Reset Password
                  </a>
                  <!--<![endif]-->
                </td>
              </tr>
            </table>

            <!-- 6-digit Code Alternative -->
            <div style="margin: 32px 0 24px 0; text-align: center;">
              <p class="text-body" style="margin: 0 0 10px 0; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">
                Or enter this 6-digit recovery code:
              </p>
              <div class="code-box" style="display: inline-block; background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px 28px; font-family: 'SF Mono', Monaco, Menlo, Consolas, monospace; font-size: 26px; font-weight: 700; letter-spacing: 0.3em; color: #0f172a;">
                ${opts.code}
              </div>
            </div>

            <div style="height: 1px; background-color: #e2e8f0; margin: 32px 0 24px 0;"></div>

            <!-- Alternative URL Copy Box -->
            <div class="alt-link-box" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #64748b;">
                Button not working? Copy and paste this URL into your browser:
              </p>
              <p style="margin: 0; font-size: 12px; line-height: 1.5; word-break: break-all;">
                <a href="${opts.resetUrl}" style="color: #2563eb; text-decoration: underline;">${opts.resetUrl}</a>
              </p>
            </div>

            <!-- Expiry & Security Notice -->
            <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #64748b;">
              This recovery link and code will expire in <strong>1 hour</strong>. If you did not make this request, you can safely ignore this email; your password will not be changed.
            </p>
          </td>
        </tr>
      </table>

      <!-- Footer -->
      <table role="presentation" width="100%" style="margin-top: 28px;">
        <tr>
          <td align="center">
            <p class="footer-text" style="margin: 0 0 8px 0; font-size: 12px; color: #94a3b8; line-height: 1.6;">
              Sent by <strong style="color: #cbd5e1;">${senderEmail}</strong> to <span style="color: #cbd5e1;">${opts.fullName}</span>
            </p>
            <p class="footer-text" style="margin: 0 0 12px 0; font-size: 11px; color: #64748b;">
              Aurikrex Inc. • 12, Montgomery Road, Yaba, Lagos, Nigeria
            </p>
            <p class="footer-text" style="margin: 0; font-size: 11px; color: #64748b;">
              <a href="https://www.aurikrex.com" class="footer-link" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Website</a> •
              <a href="https://cbt.aurikrex.com/terms" class="footer-link" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Terms of Service</a> •
              <a href="https://cbt.aurikrex.com/privacy" class="footer-link" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Privacy Policy</a> •
              <a href="mailto:${supportEmail}" class="footer-link" style="color: #94a3b8; text-decoration: underline; margin: 0 6px;">Support</a>
            </p>
            <p class="footer-text" style="margin: 12px 0 0 0; font-size: 11px; color: #475569;">
              &copy; ${year} Aurikrex. All rights reserved.
            </p>
          </td>
        </tr>
      </table>

    </div>
  </center>
</body>
</html>`;
    return { text, html };
}
//# sourceMappingURL=email-templates.js.map