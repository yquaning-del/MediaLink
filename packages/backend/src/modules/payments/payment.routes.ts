import { Router } from 'express';
import * as controller from './payment.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { paymentRateLimiter } from '../../middleware/rateLimiter.middleware';

const router = Router();

// ── Webhook (no auth — Paystack calls this) ───────────────────
/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     summary: Paystack webhook endpoint
 *     tags: [Payments]
 *     description: |
 *       Receives Paystack events. Signature verified via HMAC-SHA512.
 *       Handles: charge.success, charge.failed.
 */
router.post('/webhook', controller.paystackWebhook);

// ── Registration Fee ──────────────────────────────────────────
/**
 * @openapi
 * /payments/registration/initiate:
 *   post:
 *     summary: Initiate GHC 50 applicant registration fee payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post('/registration/initiate', authenticate, paymentRateLimiter, controller.initiateRegistrationFee);

// ── Payment Verification ──────────────────────────────────────
router.get('/verify/:reference', authenticate, controller.verifyPayment);

// ── Payment History ───────────────────────────────────────────
router.get('/history', authenticate, controller.getPaymentHistory);

// ── Revenue Share ─────────────────────────────────────────────
router.post(
  '/revenue-share/:placementId/:scheduleId/initiate',
  authenticate,
  paymentRateLimiter,
  controller.initiateRevenueSharePayment
);

// ── Subscription (Phase 3) ────────────────────────────────────
router.post('/subscription/initiate', authenticate, paymentRateLimiter, controller.initiateSubscription);

// ── Job Boost (Phase 3) ───────────────────────────────────────
router.post('/job-boost/initiate', authenticate, paymentRateLimiter, controller.initiateJobBoost);

export default router;
