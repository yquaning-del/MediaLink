import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { uploadToS3 } from '../../config/s3';
import { AppError } from '../../middleware/error.middleware';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { generatePaymentReceiptPdf } from '../../utils/pdfReceipt';
import {
  notify,
  paymentReceiptEmail,
  revenueShareDueEmail,
  registrationConfirmedEmail,
} from '../notifications/notification.service';
import { logger } from '../../config/logger';
import { calculateProfileScore } from '../../utils/profileScore';

// ─────────────────────────────────────────────
// Paystack Helpers
// ─────────────────────────────────────────────

const PAYSTACK_BASE = 'https://api.paystack.co';

async function paystackPost(endpoint: string, data: object) {
  const response = await axios.post(`${PAYSTACK_BASE}${endpoint}`, data, {
    headers: {
      Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
}

async function paystackGet(endpoint: string) {
  const response = await axios.get(`${PAYSTACK_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
  });
  return response.data;
}

// ─────────────────────────────────────────────
// Initiate Registration Fee (GHC 50)
// ─────────────────────────────────────────────

export async function initiateRegistrationFee(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { applicantProfile: true },
  });

  if (!user || user.role !== 'APPLICANT') {
    throw new AppError('Applicant account not found', 404);
  }
  if (user.status === 'ACTIVE') {
    throw new AppError('Account already activated', 400);
  }

  // Check for existing pending payment
  const existingPayment = await prisma.payment.findFirst({
    where: { payerId: userId, type: 'REGISTRATION', status: 'PENDING' },
  });

  const reference = existingPayment?.gatewayRef || `ML-REG-${uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase()}`;

  const paystackData = await paystackPost('/transaction/initialize', {
    email: user.email,
    amount: env.REGISTRATION_FEE_KOBO, // 5000 kobo = GHC 50
    currency: 'GHS',
    reference,
    callback_url: `${env.FRONTEND_URL}/applicant/payment/verify`,
    metadata: {
      userId,
      type: 'REGISTRATION',
      fullName: user.applicantProfile?.fullName,
    },
    channels: ['mobile_money', 'card', 'bank'],
  });

  // Upsert payment record
  if (!existingPayment) {
    await prisma.payment.create({
      data: {
        payerId: userId,
        type: 'REGISTRATION',
        amount: 50.0,
        gatewayRef: reference,
        status: 'PENDING',
        gateway: 'PAYSTACK',
      },
    });
  }

  return {
    authorizationUrl: paystackData.data.authorization_url,
    reference,
    amount: 50.0,
    currency: 'GHC',
  };
}

// ─────────────────────────────────────────────
// Paystack Webhook Handler
// ─────────────────────────────────────────────

export function verifyPaystackSignature(rawBody: Buffer, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

export async function handlePaystackWebhook(event: Record<string, unknown>) {
  const eventType = event.event as string;
  const data = event.data as Record<string, unknown>;

  switch (eventType) {
    case 'charge.success':
      await handleChargeSuccess(data);
      break;
    case 'charge.failed':
      await handleChargeFailed(data);
      break;
    default:
      logger.debug(`Unhandled Paystack event: ${eventType}`);
  }
}

async function handleChargeSuccess(data: Record<string, unknown>) {
  const reference = data.reference as string;
  const metadata = data.metadata as Record<string, string> | null;

  const payment = await prisma.payment.findUnique({ where: { gatewayRef: reference } });
  if (!payment) {
    logger.warn(`Payment record not found for reference: ${reference}`);
    return;
  }
  if (payment.status === 'SUCCESS') return; // idempotent

  const channel = (data.channel as string) || 'unknown';

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'SUCCESS', channel, paidAt: new Date() },
  });

  await applyPaymentSideEffects(payment.id, payment.type, payment.payerId, payment.mediaHouseId, payment.amount.toNumber(), metadata);

  await writeAuditLog({
    userId: payment.payerId,
    action: 'PAYMENT_SUCCESS',
    entity: 'Payment',
    entityId: payment.id,
    newValue: { reference, type: payment.type, amount: payment.amount },
  });
}

export async function applyPaymentSideEffects(
  paymentId: string,
  type: string,
  payerId: string,
  mediaHouseId: string | null,
  amount: number,
  metadata?: Record<string, string> | null,
) {
  if (type === 'REGISTRATION') {
    await activateApplicantAccount(payerId, paymentId, amount);
  } else if (type === 'REVENUE_SHARE') {
    await handleRevenueSharePaymentSuccess(paymentId, payerId);
  } else if (type === 'SUBSCRIPTION') {
    if (mediaHouseId) await handleSubscriptionPaymentSuccess(paymentId, mediaHouseId);
  } else if (type === 'JOB_BOOST') {
    await handleJobBoostSuccess(paymentId, metadata);
  }
}

async function handleJobBoostSuccess(paymentId: string, metadata?: Record<string, string> | null) {
  const jobId = metadata?.jobId;
  const boostDays = metadata?.boostDays ? Number(metadata.boostDays) : 7;
  if (!jobId) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    const pm = payment?.metadata as Record<string, unknown> | null;
    if (!pm?.jobId) { logger.warn(`JOB_BOOST payment ${paymentId} missing jobId`); return; }
    const jId = pm.jobId as string;
    const bDays = pm.boostDays ? Number(pm.boostDays) : 7;
    const boostUntil = new Date();
    boostUntil.setDate(boostUntil.getDate() + bDays);
    await prisma.jobListing.update({
      where: { id: jId },
      data: { isFeatured: true, boostExpiry: boostUntil },
    });
    return;
  }
  const boostUntil = new Date();
  boostUntil.setDate(boostUntil.getDate() + boostDays);
  await prisma.jobListing.update({
    where: { id: jobId },
    data: { isFeatured: true, boostExpiry: boostUntil },
  });
  logger.info(`Job ${jobId} boosted for ${boostDays} days until ${boostUntil.toISOString()}`);
}

async function handleChargeFailed(data: Record<string, unknown>) {
  const reference = data.reference as string;
  await prisma.payment.updateMany({
    where: { gatewayRef: reference, status: 'PENDING' },
    data: { status: 'FAILED' },
  });
  logger.warn(`Payment failed: ${reference}`);
}

// ─────────────────────────────────────────────
// Activate Applicant Account After Payment
// ─────────────────────────────────────────────

async function activateApplicantAccount(userId: string, paymentId: string, amount: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { applicantProfile: { include: { workExperiences: true, educations: true } } },
  });
  if (!user || !user.applicantProfile) return;

  await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });

  // Generate PDF receipt
  const receiptNo = `ML-${Date.now()}-${userId.substring(0, 6).toUpperCase()}`;
  const pdfBuffer = await generatePaymentReceiptPdf({
    receiptNumber: receiptNo,
    recipientName: user.applicantProfile.fullName,
    recipientEmail: user.email,
    amount,
    paymentType: 'Applicant Registration Fee',
    paymentMethod: 'Mobile Money / Card',
    gatewayRef: paymentId,
    paidAt: new Date(),
  });

  // Upload receipt to S3
  const s3Key = `receipts/${userId}/${receiptNo}.pdf`;
  const receiptUrl = await uploadToS3(
    env.S3_BUCKET_DOCUMENTS,
    s3Key,
    pdfBuffer,
    'application/pdf'
  ).catch((err) => { logger.error('Receipt S3 upload failed', err); return null; });

  if (receiptUrl) {
    await prisma.payment.update({ where: { id: paymentId }, data: { receiptUrl } });
  }

  // Notify via SMS + Email
  await notify({
    recipientId: userId,
    recipientPhone: user.phone,
    recipientEmail: user.email,
    type: 'REGISTRATION_CONFIRMED',
    channels: ['SMS', 'EMAIL', 'IN_APP'],
    smsMessage: `MediaLink Ghana: Your account is now active! Start building your profile at ${env.FRONTEND_URL}/applicant/profile/build`,
    emailSubject: 'Welcome to MediaLink Ghana — Account Activated!',
    emailHtml: registrationConfirmedEmail(user.applicantProfile.fullName),
    emailAttachments: pdfBuffer
      ? [
          {
            content: pdfBuffer.toString('base64'),
            filename: `Receipt-${receiptNo}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ]
      : undefined,
  });

  logger.info(`Applicant account activated: ${userId}`);
}

// ─────────────────────────────────────────────
// Revenue Share Payment Success
// ─────────────────────────────────────────────

async function handleRevenueSharePaymentSuccess(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { placement: true },
  });
  if (!payment?.placement) return;

  const schedule = await prisma.revenueShareSchedule.findFirst({
    where: { paymentId },
  });
  if (schedule) {
    await prisma.revenueShareSchedule.update({
      where: { id: schedule.id },
      data: { status: 'SUCCESS' },
    });
  }

  const monthsCompleted = payment.placement.monthsCompleted + 1;
  const monthsRemaining = Math.max(0, payment.placement.monthsRemaining - 1);

  await prisma.placement.update({
    where: { id: payment.placement.id },
    data: { monthsCompleted, monthsRemaining },
  });

  // If all 6 months complete, close the placement
  if (monthsRemaining === 0) {
    await prisma.placement.update({
      where: { id: payment.placement.id },
      data: { status: 'COMPLETED' },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await notify({
        recipientId: userId,
        recipientPhone: user.phone,
        recipientEmail: user.email,
        type: 'REVENUE_SHARE_COMPLETED',
        channels: ['SMS', 'EMAIL', 'IN_APP'],
        smsMessage: `MediaLink Ghana: Congratulations! You have completed all 6 monthly service fee payments. Your obligation is now fulfilled. Thank you!`,
        emailSubject: 'Revenue Share Complete — Congratulations!',
        emailHtml: `<p>You have successfully completed all 6 monthly service fee payments. Your MediaLink Ghana service fee obligation is now fulfilled. We wish you continued success!</p>`,
      });
    }
  }
}

// ─────────────────────────────────────────────
// Subscription Payment (Media House)
// ─────────────────────────────────────────────

async function handleSubscriptionPaymentSuccess(paymentId: string, mediaHouseId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return;

  const tierMap: Record<number, string> = {
    50000: 'BASIC',    // GHC 500 → 50000 kobo
    100000: 'PREMIUM', // GHC 1000
    200000: 'ENTERPRISE',
  };

  const koboAmount = Math.round(payment.amount.toNumber() * 100);
  const tier = tierMap[koboAmount] || 'BASIC';
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);

  await prisma.mediaHouse.update({
    where: { id: mediaHouseId },
    data: { subscriptionTier: tier as any, subscriptionExpiry: expiry },
  });
}

// ─────────────────────────────────────────────
// Initiate Revenue Share Payment
// ─────────────────────────────────────────────

export async function initiateRevenueSharePayment(userId: string, placementId: string, scheduleId: string) {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: { applicant: { include: { user: true } } },
  });
  if (!placement) throw new AppError('Placement not found', 404);
  if (placement.applicant.user.id !== userId) throw new AppError('Unauthorized: you do not own this placement', 403);
  if (placement.status !== 'ACTIVE') throw new AppError('Placement is not active', 400);

  const schedule = await prisma.revenueShareSchedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) throw new AppError('Revenue share schedule not found', 404);
  if (schedule.status === 'SUCCESS') throw new AppError('This payment has already been made', 400);

  const user = placement.applicant.user;
  const amount = Number(schedule.amount);
  const reference = `ML-RS-${placementId.substring(0, 8)}-M${schedule.monthNumber}-${Date.now()}`;

  const paystackData = await paystackPost('/transaction/initialize', {
    email: user.email,
    amount: Math.round(amount * 100), // kobo
    currency: 'GHS',
    reference,
    callback_url: `${env.FRONTEND_URL}/applicant/payments/verify`,
    metadata: {
      userId: user.id,
      type: 'REVENUE_SHARE',
      placementId,
      scheduleId,
      monthNumber: schedule.monthNumber,
    },
    channels: ['mobile_money', 'card'],
  });

  // Create payment record linked to schedule
  const payment = await prisma.payment.create({
    data: {
      payerId: user.id,
      placementId,
      type: 'REVENUE_SHARE',
      amount,
      gatewayRef: reference,
      status: 'PENDING',
      dueDate: schedule.dueDate,
      gateway: 'PAYSTACK',
    },
  });

  await prisma.revenueShareSchedule.update({
    where: { id: scheduleId },
    data: { paymentId: payment.id },
  });

  return {
    authorizationUrl: paystackData.data.authorization_url,
    reference,
    amount,
    monthNumber: schedule.monthNumber,
  };
}

// ─────────────────────────────────────────────
// Get Payment History
// ─────────────────────────────────────────────

export async function getPaymentHistory(userId: string, page: number, limit: number) {
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { payerId: userId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        type: true,
        amount: true,
        status: true,
        channel: true,
        receiptUrl: true,
        paidAt: true,
        createdAt: true,
        placement: { select: { id: true } },
      },
    }),
    prisma.payment.count({ where: { payerId: userId } }),
  ]);

  return { payments, total, page, limit };
}

// ─────────────────────────────────────────────
// Verify Payment (frontend callback verification)
// ─────────────────────────────────────────────

export async function verifyPaymentByReference(userId: string, reference: string) {
  const paystackData = await paystackGet(`/transaction/verify/${reference}`);
  const paymentData = paystackData.data;

  const payment = await prisma.payment.findUnique({ where: { gatewayRef: reference } });
  if (!payment) throw new AppError('Payment record not found', 404);
  if (payment.payerId !== userId) throw new AppError('Unauthorized: this payment does not belong to you', 403);

  return {
    status: paymentData.status,
    amount: paymentData.amount / 100, // convert kobo to GHC
    channel: paymentData.channel,
    paidAt: paymentData.paid_at,
    payment: { id: payment.id, type: payment.type, status: payment.status },
  };
}

// ─────────────────────────────────────────────
// Initiate Media House Subscription
// ─────────────────────────────────────────────

export async function initiateSubscription(
  userId: string,
  tier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { mediaHouse: true },
  });
  if (!user || !user.mediaHouse) throw new AppError('Media house not found', 404);

  const tierPrices: Record<string, number> = {
    BASIC: 50000,      // GHC 500 in kobo
    PREMIUM: 100000,   // GHC 1000 in kobo
    ENTERPRISE: 200000, // GHC 2000 in kobo
  };

  const amountKobo = tierPrices[tier];
  const reference = `ML-SUB-${user.mediaHouse.id.substring(0, 8)}-${Date.now()}`;

  const paystackData = await paystackPost('/transaction/initialize', {
    email: user.email,
    amount: amountKobo,
    currency: 'GHS',
    reference,
    callback_url: `${env.FRONTEND_URL}/employer/billing/verify`,
    metadata: {
      userId,
      mediaHouseId: user.mediaHouse.id,
      type: 'SUBSCRIPTION',
      tier,
    },
    channels: ['mobile_money', 'card', 'bank'],
  });

  await prisma.payment.create({
    data: {
      payerId: userId,
      mediaHouseId: user.mediaHouse.id,
      type: 'SUBSCRIPTION',
      amount: amountKobo / 100,
      gatewayRef: reference,
      status: 'PENDING',
      gateway: 'PAYSTACK',
      metadata: { tier },
    },
  });

  return {
    authorizationUrl: paystackData.data.authorization_url,
    reference,
    tier,
    amount: amountKobo / 100,
  };
}

// ─────────────────────────────────────────────
// Job Posting Boost Payment
// ─────────────────────────────────────────────

export async function initiateJobBoost(userId: string, jobId: string, boostDays: 7 | 14 | 30) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { mediaHouse: true } });
  if (!user || !user.mediaHouse) throw new AppError('Media house not found', 404);

  const job = await prisma.jobListing.findFirst({
    where: { id: jobId, employerId: user.mediaHouse.id },
  });
  if (!job) throw new AppError('Job listing not found', 404);

  const priceMap: Record<number, number> = { 7: 10000, 14: 25000, 30: 50000 }; // GHC 100, 250, 500
  const amountKobo = priceMap[boostDays];
  const reference = `ML-BOOST-${jobId.substring(0, 8)}-${Date.now()}`;

  const paystackData = await paystackPost('/transaction/initialize', {
    email: user.email,
    amount: amountKobo,
    currency: 'GHS',
    reference,
    metadata: { userId, jobId, type: 'JOB_BOOST', boostDays },
  });

  await prisma.payment.create({
    data: {
      payerId: userId,
      mediaHouseId: user.mediaHouse.id,
      type: 'JOB_BOOST',
      amount: amountKobo / 100,
      gatewayRef: reference,
      status: 'PENDING',
      gateway: 'PAYSTACK',
      metadata: { jobId, boostDays },
    },
  });

  return { authorizationUrl: paystackData.data.authorization_url, reference, amount: amountKobo / 100 };
}
