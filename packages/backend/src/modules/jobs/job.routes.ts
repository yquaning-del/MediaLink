import { Router } from 'express';
import { Response } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { validate, validateQuery } from '../../middleware/validate.middleware';
import { createJobSchema, updateJobSchema, updateJobStatusSchema, jobSearchSchema } from './job.schema';
import { sendSuccess, getPaginationParams } from '../../utils/response';
import * as jobService from './job.service';
import { AuthRequest } from '../../types';

const router = Router();

// ── Public: Browse Jobs ───────────────────────────────────────
router.get('/', validateQuery(jobSearchSchema), async (req, res) => {
  const q = req.query as any;
  const result = await jobService.searchJobs({
    q: q.q, skills: q.skills, region: q.region, jobType: q.jobType,
    salaryMin: q.salaryMin, salaryMax: q.salaryMax,
    page: Number(q.page || 1), limit: Number(q.limit || 20),
  });
  sendSuccess(res, result.jobs, 'Jobs retrieved.', 200, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages });
});

router.get('/:id', async (req, res) => {
  const job = await jobService.getJobById(req.params.id, true);
  sendSuccess(res, job);
});

// ── Employer: Manage Own Jobs ─────────────────────────────────
router.post(
  '/',
  authenticate,
  requireRole('EMPLOYER'),
  validate(createJobSchema),
  async (req: AuthRequest, res) => {
    const job = await jobService.createJob(req.user!.id, req.body);
    sendSuccess(res, job, 'Job listing created.', 201);
  }
);

router.put(
  '/:id',
  authenticate,
  requireRole('EMPLOYER'),
  validate(updateJobSchema),
  async (req: AuthRequest, res) => {
    const job = await jobService.updateJob(req.user!.id, req.params.id, req.body);
    sendSuccess(res, job, 'Job listing updated.');
  }
);

router.patch(
  '/:id/status',
  authenticate,
  requireRole('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'),
  validate(updateJobStatusSchema),
  async (req: AuthRequest, res) => {
    const { status } = req.body as { status: string };
    const job = await jobService.updateJobStatus(req.user!.id, req.params.id, status);
    sendSuccess(res, job, 'Job status updated.');
  }
);

router.delete(
  '/:id',
  authenticate,
  requireRole('EMPLOYER', 'ADMIN', 'SUPER_ADMIN'),
  async (req: AuthRequest, res) => {
    const result = await jobService.deleteJob(req.user!.id, req.params.id);
    sendSuccess(res, result);
  }
);

// ── Employer: Own Job Listings ────────────────────────────────
router.get(
  '/employer/my-jobs',
  authenticate,
  requireRole('EMPLOYER'),
  async (req: AuthRequest, res) => {
    const { page, limit } = getPaginationParams(req.query as any);
    const status = req.query.status as string | undefined;
    const result = await jobService.getEmployerJobs(req.user!.id, page, limit, status);
    sendSuccess(res, result.jobs, 'Jobs retrieved.', 200, { page: result.page, limit: result.limit, total: result.total });
  }
);

export default router;
