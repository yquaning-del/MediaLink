import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { sendSuccess, getPaginationParams } from '../../utils/response';
import * as applicationService from './application.service';
import { AuthRequest } from '../../types';
import { ApplicationStatus } from '@prisma/client';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const submitApplicationSchema = z.object({
  jobId: z.string().uuid(),
  coverNote: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['APPLIED', 'SHORTLISTED', 'INTERVIEWED', 'OFFER_MADE', 'HIRED', 'REJECTED']),
});

const interviewSchema = z.object({
  scheduledAt: z.string().datetime(),
  format: z.enum(['In-person', 'Video call', 'Phone call']),
  location: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
});

// ── Applicant: Submit ─────────────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole('APPLICANT'),
  validate(submitApplicationSchema),
  async (req: AuthRequest, res) => {
    const { jobId, coverNote } = req.body as { jobId: string; coverNote?: string };
    const result = await applicationService.submitApplication(req.user!.id, jobId, coverNote);
    sendSuccess(res, result, 'Application submitted successfully.', 201);
  }
);

// ── Applicant: Own Applications ───────────────────────────────
router.get(
  '/my',
  authenticate,
  requireRole('APPLICANT'),
  async (req: AuthRequest, res) => {
    const { page, limit } = getPaginationParams(req.query as any);
    const result = await applicationService.getApplicantApplications(req.user!.id, page, limit);
    sendSuccess(res, result.applications, 'Applications retrieved.', 200, {
      page: result.page, limit: result.limit, total: result.total,
    });
  }
);

// ── Employer: Get Applications for a Job ──────────────────────
router.get(
  '/job/:jobId',
  authenticate,
  requireRole('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res) => {
    const { page, limit } = getPaginationParams(req.query as any);
    const result = await applicationService.getJobApplications(req.user!.id, req.params.jobId, page, limit);
    sendSuccess(res, result.applications, 'Applications retrieved.', 200, {
      page: result.page, limit: result.limit, total: result.total,
    });
  }
);

// ── Employer: Update Status ───────────────────────────────────
router.patch(
  '/:id/status',
  authenticate,
  requireRole('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'),
  validate(updateStatusSchema),
  async (req: AuthRequest, res) => {
    const { status } = req.body as { status: ApplicationStatus };
    const result = await applicationService.updateApplicationStatus(req.user!.id, req.params.id, status);
    sendSuccess(res, result);
  }
);

// ── Employer: Send Interview Invitation ───────────────────────
router.post(
  '/:id/interview',
  authenticate,
  requireRole('EMPLOYER'),
  validate(interviewSchema),
  async (req: AuthRequest, res) => {
    const result = await applicationService.sendInterviewInvitation(req.user!.id, req.params.id, req.body);
    sendSuccess(res, result);
  }
);

export default router;
