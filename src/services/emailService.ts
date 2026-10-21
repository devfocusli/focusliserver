import nodemailer, { Transporter } from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter: Transporter | null = null;

export const getTransporter = async (): Promise<Transporter> => {
  if (transporter) {
    return transporter;
  }

  const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465;

  if (smtpUser && smtpPass) {
    console.log(`[EmailService] Initializing SMTP transporter with user: ${smtpUser}`);
    transporter = nodemailer.createTransport({
      service: 'gmail',
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  } else {
    console.warn(
      '[EmailService] No GMAIL_USER / GMAIL_APP_PASSWORD set in .env. Falling back to test/logger transporter.'
    );
    // Create an ethereal test account or json fallback
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EmailService] Using Ethereal test email account: ${testAccount.user}`);
    } catch {
      // Stream fallback
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
      });
    }
  }

  return transporter;
};

export interface SendWelcomeEmailResult {
  sent: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

export const sendWelcomeEmail = async (
  toEmail: string,
  userName: string = 'Focus Champion'
): Promise<SendWelcomeEmailResult> => {
  try {
    const mailClient = await getTransporter();
    const fromAddress =
      process.env.EMAIL_FROM ||
      (process.env.GMAIL_USER ? `"Focusli" <${process.env.GMAIL_USER}>` : '"Focusli App" <no-reply@focusli.app>');

    const displayName = userName.trim() || 'Focus Champion';

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Focusli</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0b0b0e;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #f3f4f6;
        }
        .container {
          max-width: 580px;
          margin: 30px auto;
          background: #141419;
          border: 1px solid rgba(245, 158, 11, 0.25);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .header {
          background: linear-gradient(135deg, #1f1b13 0%, #12100d 100%);
          padding: 36px 30px;
          text-align: center;
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
        }
        .brand {
          font-size: 32px;
          font-weight: 800;
          color: #f59e0b;
          letter-spacing: 1px;
          margin: 0;
        }
        .tagline {
          font-size: 14px;
          color: #d1d5db;
          margin-top: 6px;
          letter-spacing: 0.5px;
        }
        .content {
          padding: 32px 30px;
          line-height: 1.6;
          font-size: 15px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 16px;
        }
        .highlight-box {
          background: rgba(245, 158, 11, 0.08);
          border-left: 4px solid #f59e0b;
          padding: 16px 20px;
          border-radius: 8px;
          margin: 22px 0;
        }
        .feature-list {
          padding-left: 20px;
          margin: 16px 0;
        }
        .feature-list li {
          margin-bottom: 10px;
          color: #e5e7eb;
        }
        .footer {
          background: #0d0d10;
          padding: 22px 30px;
          text-align: center;
          font-size: 12px;
          color: #9ca3af;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="brand">Focusli</h1>
          <div class="tagline">Deep Work & Distraction Blocker Engine</div>
        </div>
        <div class="content">
          <div class="greeting">Welcome aboard, ${displayName}! 🚀</div>
          <p>
            Your Focusli account (<strong>${toEmail}</strong>) is now active. You’ve taken the first step toward reclaiming your attention, eliminating digital distractions, and building unbreakable deep work habits.
          </p>

          <div class="highlight-box">
            <strong style="color: #f59e0b;">✨ Here is what you can do right now:</strong>
            <ul class="feature-list">
              <li><strong>Focus Shield:</strong> Block distracting social media apps and games while your focus timer is active.</li>
              <li><strong>Recurring Routines:</strong> Automate focus intervals for your daily study or work hours.</li>
              <li><strong>Study Rooms:</strong> Join public accountability groups, climb the leaderboard, and exchange motivational cheers.</li>
              <li><strong>Seamless Sync:</strong> All your focus sessions, stats, and streaks are now safely synced to your account.</li>
            </ul>
          </div>

          <p>
            Open Focusli on your phone and start your first 25-minute focus session today!
          </p>

          <p style="margin-top: 28px; color: #9ca3af; font-size: 13px;">
            Stay focused,<br>
            <strong style="color: #f59e0b;">The Focusli Team</strong>
          </p>
        </div>
        <div class="footer">
          You received this email because you created an account with Focusli.<br>
          © ${new Date().getFullYear()} Focusli Engine. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    `;

    const info = await mailClient.sendMail({
      from: fromAddress,
      to: toEmail,
      subject: `🌟 Welcome to Focusli, ${displayName}! Your Deep Work Journey Begins`,
      text: `Welcome to Focusli, ${displayName}!\n\nYour account (${toEmail}) has been created.\nStart your first focus session and reclaim your focus today!\n\n- The Focusli Team`,
      html: htmlContent,
    });

    console.log(`[EmailService] Welcome email sent successfully to ${toEmail}. MessageId: ${info.messageId}`);

    let previewUrl: string | undefined;
    try {
      const etherealUrl = nodemailer.getTestMessageUrl(info);
      if (etherealUrl) {
        previewUrl = etherealUrl.toString();
        console.log(`[EmailService] Ethereal preview URL: ${previewUrl}`);
      }
    } catch {}

    return {
      sent: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error: any) {
    console.error(`[EmailService] Failed to send welcome email to ${toEmail}:`, error);
    return {
      sent: false,
      error: error?.message || 'Failed to send welcome email',
    };
  }
};
