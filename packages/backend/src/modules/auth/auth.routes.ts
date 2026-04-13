import { Router } from 'express';
import * as controller from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { authRateLimiter, otpRateLimiter } from '../../middleware/rateLimiter.middleware';
import {
  registerApplicantSchema,
  registerEmployerSchema,
  verifyOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  setup2FASchema,
  verify2FASchema,
} from './auth.schema';

const router = Router();

// ── Registration ──────────────────────────────────────────────
/**
 * @openapi
 * /auth/register/applicant:
 *   post:
 *     summary: Register a new applicant
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterApplicant'
 *     responses:
 *       201:
 *         description: OTP sent to phone number
 *       409:
 *         description: Email or phone already registered
 */
router.post('/register/applicant', validate(registerApplicantSchema), controller.registerApplicant);

/**
 * @openapi
 * /auth/register/employer:
 *   post:
 *     summary: Register a new media house employer account
 *     tags: [Auth]
 */
router.post('/register/employer', validate(registerEmployerSchema), controller.registerEmployer);

// ── OTP ───────────────────────────────────────────────────────
router.post('/verify-otp', otpRateLimiter, validate(verifyOtpSchema), controller.verifyOtp);
router.post('/resend-otp', otpRateLimiter, controller.resendOtp);

// ── Login / Logout ────────────────────────────────────────────
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     description: |
 *       Returns a JWT access token (30-min expiry) and sets an HttpOnly
 *       refresh token cookie. If 2FA is enabled, twoFACode is required.
 *       Max 5 failed attempts before 15-minute lockout.
 */
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
router.post('/refresh', controller.refreshToken);
router.post('/logout', authenticate, controller.logout);

// ── Password Reset ────────────────────────────────────────────
router.post('/forgot-password', otpRateLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);

// ── 2FA ───────────────────────────────────────────────────────
router.post('/2fa/setup', authenticate, validate(setup2FASchema), controller.setup2FA);
router.post('/2fa/verify', authenticate, validate(verify2FASchema), controller.verify2FASetup);
router.post('/2fa/disable', authenticate, validate(verify2FASchema), controller.disable2FA);

// ── Profile ───────────────────────────────────────────────────
router.get('/me', authenticate, controller.getMe);

export default router;
