import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import * as employerService from './employer.service';
import { AuthRequest } from '../../types';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

// ── Get Own Employer Profile ──────────────────────────────────
router.get('/profile', authenticate, requireRole('EMPLOYER'), async (req: AuthRequest, res) => {
  const result = await employerService.getEmployerProfile(req.user!.id);
  sendSuccess(res, result);
});

// ── Update Employer Profile ───────────────────────────────────
router.put(
  '/profile',
  authenticate,
  requireRole('EMPLOYER'),
  validate(z.object({
    companyName: z.string().optional(),
    industryType: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().url().optional().nullable(),
  })),
  async (req: AuthRequest, res) => {
    const result = await employerService.updateEmployerProfile(req.user!.id, req.body);
    sendSuccess(res, result, 'Profile updated.');
  }
);

// ── Employer Analytics ────────────────────────────────────────
router.get('/analytics', authenticate, requireRole('EMPLOYER'), async (req: AuthRequest, res) => {
  const result = await employerService.getEmployerAnalytics(req.user!.id);
  sendSuccess(res, result);
});

export default router;
