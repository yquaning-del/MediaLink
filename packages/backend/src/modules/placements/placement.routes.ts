import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import * as placementService from './placement.service';
import { AuthRequest } from '../../types';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const confirmPlacementSchema = z.object({
  applicationId: z.string().uuid(),
  startDate: z.string().datetime(),
  salaryAgreed: z.number().positive('Salary must be a positive number'),
  revenueShareRate: z.number().min(0.03).max(0.05).optional(),
});

const signContractSchema = z.object({
  role: z.enum(['APPLICANT', 'EMPLOYER']),
});

// ── Employer: Confirm Hire ────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'),
  validate(confirmPlacementSchema),
  async (req: AuthRequest, res) => {
    const result = await placementService.confirmPlacement(req.user!.id, req.body.applicationId, req.body);
    sendSuccess(res, result, 'Placement confirmed. Placement Agreement generated.', 201);
  }
);

// ── Sign Contract ─────────────────────────────────────────────
router.post(
  '/:id/sign',
  authenticate,
  validate(signContractSchema),
  async (req: AuthRequest, res) => {
    const { role } = req.body as { role: 'APPLICANT' | 'EMPLOYER' };
    const result = await placementService.signContract(req.user!.id, req.params.id, role);
    sendSuccess(res, result);
  }
);

// ── Get Single Placement ──────────────────────────────────────
router.get(
  '/:id',
  authenticate,
  async (req: AuthRequest, res) => {
    const result = await placementService.getPlacementById(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }
);

// ── Applicant: My Placements ──────────────────────────────────
router.get(
  '/',
  authenticate,
  requireRole('APPLICANT'),
  async (req: AuthRequest, res) => {
    const result = await placementService.getApplicantPlacements(req.user!.id);
    sendSuccess(res, result);
  }
);

export default router;
