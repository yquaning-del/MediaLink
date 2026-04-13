import { Request, Response } from 'express';
import * as paymentService from './payment.service';
import { sendSuccess, sendError, getPaginationParams } from '../../utils/response';
import { AuthRequest } from '../../types';
import { logger } from '../../config/logger';

export async function initiateRegistrationFee(req: AuthRequest, res: Response): Promise<void> {
  const result = await paymentService.initiateRegistrationFee(req.user!.id);
  sendSuccess(res, result, 'Payment session created. Redirecting to Paystack.');
}

export async function paystackWebhook(req: Request, res: Response): Promise<void> {
  const signature = req.headers['x-paystack-signature'] as string;
  const rawBody = (req as any).rawBody as Buffer;

  if (!signature || !rawBody) {
    res.status(400).json({ message: 'Missing signature or body' });
    return;
  }

  const isValid = paymentService.verifyPaystackSignature(rawBody, signature);
  if (!isValid) {
    logger.warn('Invalid Paystack webhook signature');
    res.status(401).json({ message: 'Invalid signature' });
    return;
  }

  // Respond immediately — process async
  res.status(200).json({ message: 'OK' });

  try {
    await paymentService.handlePaystackWebhook(req.body as Record<string, unknown>);
  } catch (err) {
    logger.error('Webhook processing error', err);
  }
}

export async function verifyPayment(req: AuthRequest, res: Response): Promise<void> {
  const { reference } = req.params;
  const result = await paymentService.verifyPaymentByReference(req.user!.id, reference);
  sendSuccess(res, result);
}

export async function getPaymentHistory(req: AuthRequest, res: Response): Promise<void> {
  const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);
  const result = await paymentService.getPaymentHistory(req.user!.id, page, limit);
  sendSuccess(res, result.payments, 'Payment history retrieved.', 200, {
    page,
    limit,
    total: result.total,
    totalPages: Math.ceil(result.total / limit),
  });
}

export async function initiateSubscription(req: AuthRequest, res: Response): Promise<void> {
  const { tier } = req.body as { tier: 'BASIC' | 'PREMIUM' | 'ENTERPRISE' };
  const result = await paymentService.initiateSubscription(req.user!.id, tier);
  sendSuccess(res, result);
}

export async function initiateJobBoost(req: AuthRequest, res: Response): Promise<void> {
  const { jobId, boostDays } = req.body as { jobId: string; boostDays: 7 | 14 | 30 };
  const result = await paymentService.initiateJobBoost(req.user!.id, jobId, boostDays);
  sendSuccess(res, result);
}

export async function initiateRevenueSharePayment(req: AuthRequest, res: Response): Promise<void> {
  const { placementId, scheduleId } = req.params;
  const result = await paymentService.initiateRevenueSharePayment(req.user!.id, placementId, scheduleId);
  sendSuccess(res, result);
}
