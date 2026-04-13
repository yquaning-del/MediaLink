import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { sendSuccess, sendError } from '../../utils/response';
import * as aiService from './ai.service';
import { AuthRequest } from '../../types';

const router = Router();

/**
 * @openapi
 * /ai/profile-coach:
 *   get:
 *     summary: AI profile completeness coach
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: Returns AI-generated suggestions to improve applicant profile
 */
router.get(
  '/profile-coach',
  authenticate,
  requireRole('APPLICANT'),
  async (req: AuthRequest, res) => {
    const result = await aiService.getProfileCoachSuggestions(req.user!.id);
    sendSuccess(res, result, 'Profile coach suggestions generated.');
  },
);

/**
 * @openapi
 * /ai/generate-job-description:
 *   post:
 *     summary: AI job description generator
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: Generates a compelling job description from basic inputs
 */
router.post(
  '/generate-job-description',
  authenticate,
  requireRole('EMPLOYER'),
  async (req: AuthRequest, res) => {
    const result = await aiService.generateJobDescription(req.user!.id, req.body);
    sendSuccess(res, result, 'Job description generated.');
  },
);

/**
 * @openapi
 * /ai/candidate-summary/:applicationId:
 *   get:
 *     summary: AI candidate summarization
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: Returns an AI summary of candidate fit for a specific job
 */
router.get(
  '/candidate-summary/:applicationId',
  authenticate,
  requireRole('EMPLOYER'),
  async (req: AuthRequest, res) => {
    const result = await aiService.summarizeCandidateForJob(req.user!.id, req.params.applicationId);
    sendSuccess(res, result, 'Candidate summary generated.');
  },
);

/**
 * @openapi
 * /ai/salary-insights:
 *   get:
 *     summary: Salary insights from placement data
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     description: Returns salary benchmarks by role, region, and media type
 */
router.get(
  '/salary-insights',
  authenticate,
  async (req: AuthRequest, res) => {
    const { role, region, jobType } = req.query as { role?: string; region?: string; jobType?: string };
    const result = await aiService.getSalaryInsights({ role, region, jobType });
    sendSuccess(res, result, 'Salary insights retrieved.');
  },
);

export default router;
