import sgMail from '@sendgrid/mail';
import twilio from 'twilio';
import { env } from '../../config/env';
import { prisma } from '../../config/database';
import { toInternationalFormat } from '../../utils/phoneFormat';
import { logger } from '../../config/logger';
import { NotifChannel, Prisma } from '@prisma/client';

sgMail.setApiKey(env.SENDGRID_API_KEY);

const twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);

// ─────────────────────────────────────────────
// SMS via Twilio
// ─────────────────────────────────────────────

export async function sendSms(to: string, message: string): Promise<void> {
  const intlNumber = toInternationalFormat(to);
  try {
    await twilioClient.messages.create({
      body: message,
      from: env.TWILIO_PHONE_NUMBER,
      to: intlNumber,
    });
    logger.debug(`SMS sent to ${intlNumber}`);
  } catch (err) {
    logger.error('Twilio SMS failed', { to: intlNumber, err });
    throw err;
  }
}

// ─────────────────────────────────────────────
// Email via SendGrid
// ─────────────────────────────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    content: string; // base64
    filename: string;
    type: string;
    disposition: 'attachment' | 'inline';
  }>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await sgMail.send({
      to: options.to,
      from: { email: env.SENDGRID_FROM_EMAIL, name: env.SENDGRID_FROM_NAME },
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });
    logger.debug(`Email sent to ${options.to}: ${options.subject}`);
  } catch (err) {
    logger.error('SendGrid email failed', { to: options.to, err });
    throw err;
  }
}

// ─────────────────────────────────────────────
// Notification Dispatcher
// ─────────────────────────────────────────────

interface NotifyParams {
  recipientId: string;
  recipientPhone?: string;
  recipientEmail?: string;
  type: string;
  channels: NotifChannel[];
  smsMessage?: string;
  emailSubject?: string;
  emailHtml?: string;
  metadata?: Record<string, unknown>;
  emailAttachments?: EmailOptions['attachments'];
}

export async function notify(params: NotifyParams): Promise<void> {
  const promises: Promise<void>[] = [];

  for (const channel of params.channels) {
    if (channel === 'SMS' && params.recipientPhone && params.smsMessage) {
      promises.push(
        sendSms(params.recipientPhone, params.smsMessage).catch((e) => {
          logger.error('SMS notify failed', e);
        })
      );
    }

    if (channel === 'EMAIL' && params.recipientEmail && params.emailSubject && params.emailHtml) {
      promises.push(
        sendEmail({
          to: params.recipientEmail,
          subject: params.emailSubject,
          html: params.emailHtml,
          attachments: params.emailAttachments,
        }).catch((e) => {
          logger.error('Email notify failed', e);
        })
      );
    }
  }

  // Always save in-app notification to DB
  promises.push(
    prisma.notification
      .create({
        data: {
          recipientId: params.recipientId,
          channel: 'IN_APP',
          type: params.type,
          content: params.smsMessage || params.emailSubject || params.type,
          metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        },
      })
      .then(() => undefined)
      .catch((e) => {
        logger.error('In-app notification save failed', e);
      })
  );

  await Promise.allSettled(promises);
}

// ─────────────────────────────────────────────
// Email HTML Templates
// ─────────────────────────────────────────────

export function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; }
    .header { background: #1a3a5c; padding: 24px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; }
    .header p { color: #c8861a; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 32px 24px; color: #333; line-height: 1.6; }
    .btn { display: inline-block; background: #c8861a; color: #fff !important; padding: 12px 28px;
           border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0; }
    .footer { background: #f4f6f9; padding: 16px; text-align: center; font-size: 12px; color: #888; }
    .amount { font-size: 24px; font-weight: bold; color: #1a3a5c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MEDIALINK GHANA</h1>
      <p>Sales Recruiter Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} MediaLink Ghana &bull; medialink.com.gh<br/>
      <small>If you did not request this email, please ignore it.</small>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function registrationConfirmedEmail(name: string): string {
  return emailWrapper(`
    <h2>Welcome to MediaLink Ghana, ${name}! 🎉</h2>
    <p>Your account has been activated successfully. You are now ready to build your profile and start applying for exciting media sales roles across Ghana.</p>
    <p><strong>Next step:</strong> Complete your profile to at least 60% to become visible to top media houses.</p>
    <a href="${env.FRONTEND_URL}/applicant/profile/build" class="btn">Complete Your Profile</a>
    <p>If you have any questions, our support team is here to help at <a href="mailto:support@medialink.com.gh">support@medialink.com.gh</a>.</p>
  `);
}

export function jobMatchAlertEmail(name: string, jobTitle: string, employer: string, jobUrl: string): string {
  return emailWrapper(`
    <h2>New Job Match for You, ${name}!</h2>
    <p>Great news — a new position matching your profile has just been posted:</p>
    <table style="background:#f9f9f9;padding:16px;border-radius:6px;width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;"><strong>Role:</strong></td><td>${jobTitle}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Company:</strong></td><td>${employer}</td></tr>
    </table>
    <a href="${jobUrl}" class="btn">View & Apply Now</a>
    <p><em>This match was calculated based on your skills, experience, and location preferences.</em></p>
  `);
}

export function paymentReceiptEmail(name: string, amount: number, receiptNo: string): string {
  return emailWrapper(`
    <h2>Payment Confirmed</h2>
    <p>Dear ${name},</p>
    <p>We have received your payment. Here are the details:</p>
    <p class="amount">GHC ${amount.toFixed(2)}</p>
    <p><strong>Receipt No:</strong> ${receiptNo}</p>
    <p>Your PDF receipt is attached to this email. Please keep it for your records.</p>
    <p>Thank you for choosing MediaLink Ghana!</p>
  `);
}

export function revenueShareDueEmail(
  name: string,
  amount: number,
  dueDate: string,
  payLink: string,
  monthsRemaining: number
): string {
  return emailWrapper(`
    <h2>Monthly Service Fee Due</h2>
    <p>Dear ${name},</p>
    <p>Your monthly MediaLink Ghana service fee is due:</p>
    <p class="amount">GHC ${amount.toFixed(2)}</p>
    <p><strong>Due Date:</strong> ${dueDate}</p>
    <p><strong>Months Remaining (after this payment):</strong> ${monthsRemaining - 1}</p>
    <a href="${payLink}" class="btn">Pay Now via Mobile Money</a>
    <p>Payment can be made via MTN MoMo, Vodafone Cash, or AirtelTigo Money.</p>
    <p><em>Failure to pay within 7 days may result in account restrictions.</em></p>
  `);
}

export function placementConfirmedEmail(
  applicantName: string,
  employer: string,
  role: string,
  startDate: string
): string {
  return emailWrapper(`
    <h2>Congratulations — You've Been Placed! 🎊</h2>
    <p>Dear ${applicantName},</p>
    <p>We are thrilled to confirm your successful placement:</p>
    <table style="background:#f9f9f9;padding:16px;border-radius:6px;width:100%;border-collapse:collapse;">
      <tr><td style="padding:6px 0;"><strong>Employer:</strong></td><td>${employer}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Role:</strong></td><td>${role}</td></tr>
      <tr><td style="padding:6px 0;"><strong>Start Date:</strong></td><td>${startDate}</td></tr>
    </table>
    <p>Please review and sign your Placement Agreement via your dashboard.</p>
    <a href="${env.FRONTEND_URL}/applicant/placements" class="btn">View Placement Agreement</a>
    <p>Your 6-month revenue share schedule will commence from your start date.</p>
  `);
}

export function kybApprovedEmail(companyName: string, contactName: string): string {
  return emailWrapper(`
    <h2>Account Approved — Welcome, ${companyName}!</h2>
    <p>Dear ${contactName},</p>
    <p>Your Media House account has been verified and approved by the MediaLink Ghana team.</p>
    <p>You can now:</p>
    <ul>
      <li>Post job listings</li>
      <li>Browse matched candidates</li>
      <li>Manage your hiring pipeline</li>
    </ul>
    <a href="${env.FRONTEND_URL}/employer/dashboard" class="btn">Go to Employer Dashboard</a>
  `);
}

export function broadcastEmail(subject: string, body: string): string {
  return emailWrapper(`<h2>${subject}</h2>${body}`);
}
