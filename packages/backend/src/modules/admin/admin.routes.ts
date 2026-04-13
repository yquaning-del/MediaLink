import { Router } from 'express';
import { authenticate, requireAdmin, requireRole } from '../../middleware/auth.middleware';
import { sendSuccess, getPaginationParams } from '../../utils/response';
import * as adminService from './admin.service';
import * as employerService from '../employers/employer.service';
import { AuthRequest } from '../../types';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

// ── Analytics Dashboard ───────────────────────────────────────
/**
 * @openapi
 * /admin/analytics:
 *   get:
 *     summary: Platform KPI analytics dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/analytics', async (_req, res) => {
  const data = await adminService.getAnalytics();
  sendSuccess(res, data);
});

// ── User Management ───────────────────────────────────────────
router.get('/users', async (req: AuthRequest, res) => {
  const { page, limit } = getPaginationParams(req.query as any);
  const q = req.query as any;
  const result = await adminService.getUsers({ role: q.role, status: q.status, search: q.search, page, limit });
  sendSuccess(res, result.users, 'Users retrieved.', 200, { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages });
});

router.get('/users/:id', async (req, res) => {
  const user = await adminService.getUserById(req.params.id);
  sendSuccess(res, user);
});

router.patch(
  '/users/:id/status',
  validate(z.object({ status: z.enum(['ACTIVE', 'SUSPENDED', 'DELETED']), reason: z.string().optional() })),
  async (req: AuthRequest, res) => {
    const { status, reason } = req.body as { status: string; reason?: string };
    const result = await adminService.updateUserStatus(req.user!.id, req.params.id, status, reason);
    sendSuccess(res, result);
  }
);

router.post('/users/:id/reset-password', async (req: AuthRequest, res) => {
  const result = await adminService.resetUserPassword(req.user!.id, req.params.id);
  sendSuccess(res, result);
});

router.delete('/users/:id', async (req: AuthRequest, res) => {
  const result = await adminService.deleteUser(req.user!.id, req.params.id);
  sendSuccess(res, result);
});

// ── KYB / Employer Approval ───────────────────────────────────
router.get('/employers/pending', async (req: AuthRequest, res) => {
  const { page, limit } = getPaginationParams(req.query as any);
  const result = await adminService.getPendingEmployers(page, limit);
  sendSuccess(res, result.employers, 'Pending employers.', 200, { page: result.page, limit: result.limit, total: result.total });
});

router.post(
  '/employers/:id/approve',
  validate(z.object({ notes: z.string().optional() })),
  async (req: AuthRequest, res) => {
    const result = await employerService.approveEmployer(req.params.id, req.user!.id, req.body.notes);
    sendSuccess(res, result);
  }
);

router.post(
  '/employers/:id/reject',
  validate(z.object({ reason: z.string().min(10) })),
  async (req: AuthRequest, res) => {
    const result = await employerService.rejectEmployer(req.params.id, req.user!.id, req.body.reason);
    sendSuccess(res, result);
  }
);

// ── Job Moderation ────────────────────────────────────────────
router.get('/jobs', async (req: AuthRequest, res) => {
  const { page, limit } = getPaginationParams(req.query as any);
  const result = await adminService.getAllJobs({ status: req.query.status as string, page, limit });
  sendSuccess(res, result.jobs, 'Jobs retrieved.', 200, { page: result.page, limit: result.limit, total: result.total });
});

router.patch(
  '/jobs/:id/moderate',
  validate(z.object({ action: z.enum(['PAUSE', 'CLOSE', 'ACTIVATE']) })),
  async (req: AuthRequest, res) => {
    const result = await adminService.moderateJob(req.user!.id, req.params.id, req.body.action);
    sendSuccess(res, result);
  }
);

// ── Placement Management ──────────────────────────────────────
router.get('/placements', async (req: AuthRequest, res) => {
  const { page, limit } = getPaginationParams(req.query as any);
  const result = await adminService.getAllPlacements({ status: req.query.status as string, page, limit });
  sendSuccess(res, result.placements, 'Placements retrieved.', 200, { page: result.page, limit: result.limit, total: result.total });
});

router.patch(
  '/placements/:id/rate',
  validate(z.object({ rate: z.number().min(0.03).max(0.05), reason: z.string().min(5) })),
  async (req: AuthRequest, res) => {
    const result = await adminService.updatePlacementRevenueRate(req.user!.id, req.params.id, req.body.rate, req.body.reason);
    sendSuccess(res, result);
  }
);

router.patch(
  '/placements/:id/status',
  validate(z.object({ status: z.enum(['ACTIVE', 'COMPLETED', 'TERMINATED', 'DISPUTED']) })),
  async (req: AuthRequest, res) => {
    const result = await adminService.updatePlacementStatus(req.user!.id, req.params.id, req.body.status);
    sendSuccess(res, result);
  }
);

// ── Payments Dashboard ────────────────────────────────────────
router.get('/payments', async (req: AuthRequest, res) => {
  const { page, limit } = getPaginationParams(req.query as any);
  const q = req.query as any;
  const result = await adminService.getPaymentsDashboard({ type: q.type, status: q.status, page, limit });
  sendSuccess(res, result.payments, 'Payments retrieved.', 200, { page: result.page, limit: result.limit, total: result.total });
});

router.post('/payments/:id/mark-paid', async (req: AuthRequest, res) => {
  const result = await adminService.markPaymentPaid(req.user!.id, req.params.id);
  sendSuccess(res, result);
});

// ── Finance Reports Export ────────────────────────────────────
router.get('/reports/finance', async (req, res) => {
  const format = (req.query.format as 'csv' | 'excel' | 'pdf') || 'excel';
  const report = await adminService.exportFinanceReport(format);
  res.setHeader('Content-Type', report.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
  res.send(report.buffer);
});

// ── Broadcast Messaging ───────────────────────────────────────
router.post(
  '/broadcast',
  validate(z.object({
    target: z.enum(['APPLICANTS', 'EMPLOYERS', 'ALL']),
    subject: z.string().min(1).max(200),
    message: z.string().min(1).max(5000),
  })),
  async (req: AuthRequest, res) => {
    const { target, subject, message } = req.body as { target: 'APPLICANTS' | 'EMPLOYERS' | 'ALL'; subject: string; message: string };
    const result = await adminService.sendBroadcast(req.user!.id, target, subject, message);
    sendSuccess(res, result);
  }
);

// ── Audit Log ─────────────────────────────────────────────────
router.get('/audit-log', async (req: AuthRequest, res) => {
  const { page, limit } = getPaginationParams(req.query as any);
  const q = req.query as any;
  const result = await adminService.getAuditLog({ userId: q.userId, action: q.action, entity: q.entity, from: q.from, to: q.to, page, limit });
  sendSuccess(res, result.logs, 'Audit log retrieved.', 200, { page: result.page, limit: result.limit, total: result.total });
});

// ── Platform Config ───────────────────────────────────────────
router.get('/config', async (_req, res) => {
  const config = await adminService.getPlatformConfig();
  sendSuccess(res, config);
});

router.put(
  '/config',
  validate(z.object({ key: z.string(), value: z.string() })),
  async (req: AuthRequest, res) => {
    const result = await adminService.setPlatformConfig(req.user!.id, req.body.key, req.body.value);
    sendSuccess(res, result);
  }
);

// ── Skills Taxonomy Management ────────────────────────────────
router.post(
  '/skills',
  validate(z.object({ action: z.enum(['ADD', 'DEACTIVATE']), skillName: z.string(), category: z.string().optional() })),
  async (req: AuthRequest, res) => {
    const result = await adminService.manageSkillTaxonomy(req.user!.id, req.body.action, req.body.skillName, req.body.category);
    sendSuccess(res, result);
  }
);

// ── Notifications ─────────────────────────────────────────────
router.get('/notifications', authenticate, async (req: AuthRequest, res) => {
  const { page, limit, skip } = getPaginationParams(req.query as any);
  const [notifs, total] = await Promise.all([
    (await import('../../config/database')).prisma.notification.findMany({
      where: { recipientId: req.user!.id },
      skip, take: limit, orderBy: { sentAt: 'desc' },
    }),
    (await import('../../config/database')).prisma.notification.count({ where: { recipientId: req.user!.id } }),
  ]);
  sendSuccess(res, notifs, 'Notifications.', 200, { page, limit, total });
});

export default router;
