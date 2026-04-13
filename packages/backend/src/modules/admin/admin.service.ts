import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { notify, broadcastEmail } from '../notifications/notification.service';
import ExcelJS from 'exceljs';
import { generatePaymentReceiptPdf } from '../../utils/pdfReceipt';
import { env } from '../../config/env';

// ─────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────

export async function getUsers(params: {
  role?: string;
  status?: string;
  region?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  const { role, status, search, page, limit } = params;

  const where: any = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { applicantProfile: { fullName: { contains: search, mode: 'insensitive' } } },
      { mediaHouse: { companyName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        applicantProfile: { select: { fullName: true, region: true, completionScore: true } },
        mediaHouse: { select: { companyName: true, kybStatus: true, verified: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      applicantProfile: { include: { workExperiences: true, educations: true } },
      mediaHouse: { include: { jobListings: { take: 5, orderBy: { createdAt: 'desc' } } } },
      payments: { take: 10, orderBy: { createdAt: 'desc' } },
      auditLogs: { take: 20, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!user) throw new AppError('User not found', 404);
  const { passwordHash, twoFASecret, ...safe } = user as any;
  return safe;
}

export async function updateUserStatus(
  adminId: string,
  userId: string,
  status: string,
  reason?: string
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const oldStatus = user.status;
  await prisma.user.update({ where: { id: userId }, data: { status: status as any } });

  await writeAuditLog({
    userId: adminId,
    action: `USER_STATUS_${status}`,
    entity: 'User',
    entityId: userId,
    oldValue: { status: oldStatus },
    newValue: { status, reason },
  });

  if (status === 'SUSPENDED' && reason) {
    await notify({
      recipientId: userId,
      recipientEmail: user.email,
      recipientPhone: user.phone,
      type: 'ACCOUNT_SUSPENDED',
      channels: ['EMAIL', 'SMS', 'IN_APP'],
      smsMessage: `MediaLink Ghana: Your account has been suspended. Reason: ${reason}. Contact support@medialink.com.gh.`,
      emailSubject: 'Account Suspended — MediaLink Ghana',
      emailHtml: `<p>Your account has been suspended.</p><p><strong>Reason:</strong> ${reason}</p><p>Please contact <a href="mailto:support@medialink.com.gh">support@medialink.com.gh</a> if you believe this is an error.</p>`,
    }).catch(() => {});
  }

  return { message: `User status updated to ${status}.` };
}

export async function deleteUser(adminId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  // Soft delete
  await prisma.user.update({ where: { id: userId }, data: { status: 'DELETED', email: `deleted_${Date.now()}_${user.email}` } });

  await writeAuditLog({ userId: adminId, action: 'USER_DELETED', entity: 'User', entityId: userId });
  return { message: 'User account deleted.' };
}

export async function resetUserPassword(adminId: string, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  // Force a temporary password — user must reset on next login
  const bcrypt = await import('bcryptjs');
  const crypto = await import('crypto');
  const tempPassword = crypto.randomBytes(6).toString('base64url').slice(0, 10);
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  await notify({
    recipientId: userId,
    recipientEmail: user.email,
    recipientPhone: user.phone,
    type: 'PASSWORD_RESET_ADMIN',
    channels: ['EMAIL', 'SMS'],
    smsMessage: `MediaLink Ghana: Your password has been reset by admin. Temporary password: ${tempPassword}. Please change it immediately.`,
    emailSubject: 'Password Reset — MediaLink Ghana',
    emailHtml: `<p>Your password has been reset by an administrator.</p><p><strong>Temporary Password:</strong> <code>${tempPassword}</code></p><p>Please log in and change your password immediately.</p>`,
  }).catch(() => {});

  await writeAuditLog({ userId: adminId, action: 'PASSWORD_RESET_ADMIN', entity: 'User', entityId: userId });
  return { message: 'Password reset and temporary credentials sent.' };
}

// ─────────────────────────────────────────────
// KYB Pending Employers
// ─────────────────────────────────────────────

export async function getPendingEmployers(page: number, limit: number) {
  const [employers, total] = await Promise.all([
    prisma.mediaHouse.findMany({
      where: { kybStatus: 'PENDING' },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { email: true, phone: true, createdAt: true } } },
    }),
    prisma.mediaHouse.count({ where: { kybStatus: 'PENDING' } }),
  ]);
  return { employers, total, page, limit };
}

// ─────────────────────────────────────────────
// Placement Management
// ─────────────────────────────────────────────

export async function getAllPlacements(params: { status?: string; page: number; limit: number }) {
  const where: any = {};
  if (params.status) where.status = params.status;

  const [placements, total] = await Promise.all([
    prisma.placement.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        applicant: { select: { fullName: true, region: true } },
        application: {
          include: { job: { include: { employer: { select: { companyName: true } } } } },
        },
        revenueShareSchedules: true,
        _count: { select: { payments: true } },
      },
    }),
    prisma.placement.count({ where }),
  ]);

  return { placements, total, page: params.page, limit: params.limit };
}

export async function updatePlacementRevenueRate(
  adminId: string,
  placementId: string,
  newRate: number,
  reason: string
) {
  if (newRate < 0.03 || newRate > 0.05) {
    throw new AppError('Revenue share rate must be between 3% and 5%', 400);
  }

  const placement = await prisma.placement.findUnique({ where: { id: placementId } });
  if (!placement) throw new AppError('Placement not found', 404);

  const oldRate = Number(placement.revenueShareRate);
  await prisma.placement.update({ where: { id: placementId }, data: { revenueShareRate: newRate } });

  // Update future unpaid schedules with new rate
  const salary = Number(placement.salaryAgreed);
  const newMonthlyFee = salary * newRate;

  await prisma.revenueShareSchedule.updateMany({
    where: { placementId, status: 'PENDING' },
    data: { amount: newMonthlyFee },
  });

  await writeAuditLog({
    userId: adminId,
    action: 'REVENUE_RATE_ADJUSTED',
    entity: 'Placement',
    entityId: placementId,
    oldValue: { revenueShareRate: oldRate },
    newValue: { revenueShareRate: newRate, reason },
  });

  return { message: `Revenue share rate updated to ${(newRate * 100).toFixed(1)}%.` };
}

export async function updatePlacementStatus(adminId: string, placementId: string, status: string) {
  const placement = await prisma.placement.findUnique({ where: { id: placementId } });
  if (!placement) throw new AppError('Placement not found', 404);

  await prisma.placement.update({ where: { id: placementId }, data: { status: status as any } });

  await writeAuditLog({
    userId: adminId,
    action: `PLACEMENT_${status}`,
    entity: 'Placement',
    entityId: placementId,
    newValue: { status },
  });

  return { message: `Placement marked as ${status}.` };
}

// ─────────────────────────────────────────────
// Analytics Dashboard (SRS §3.7.4)
// ─────────────────────────────────────────────

export async function getAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [
    totalApplicants,
    totalEmployers,
    activeJobs,
    totalPlacements,
    monthlyPlacements,
    registrationRevenue,
    revenueShareRevenue,
    totalRevenue,
    applicantsByRegion,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'APPLICANT', status: 'ACTIVE' } }),
    prisma.mediaHouse.count({ where: { verified: true } }),
    prisma.jobListing.count({ where: { status: 'ACTIVE' } }),
    prisma.placement.count(),
    prisma.placement.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.payment.aggregate({
      where: { type: 'REGISTRATION', status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { type: 'REVENUE_SHARE', status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    }),
    prisma.applicantProfile.groupBy({
      by: ['region'],
      _count: { id: true },
      where: { region: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    }),
  ]);

  // Conversion rate
  const totalRegistered = await prisma.user.count({ where: { role: 'APPLICANT' } });
  const conversionRate = totalRegistered > 0
    ? ((totalPlacements / totalRegistered) * 100).toFixed(1)
    : '0.0';

  // Average time to placement (days)
  const avgTimeToPlacements = await prisma.$queryRaw<{ avg_days: number }[]>`
    SELECT AVG(
      EXTRACT(EPOCH FROM (p.created_at - u.created_at)) / 86400
    ) as avg_days
    FROM placements p
    JOIN applicant_profiles ap ON p.applicant_id = ap.id
    JOIN users u ON ap.user_id = u.id
  `.catch(() => [{ avg_days: 0 }]);

  return {
    applicants: {
      total: totalApplicants,
      totalRegistered,
      byRegion: applicantsByRegion.map((r) => ({ region: r.region, count: r._count.id })),
    },
    employers: { total: totalEmployers },
    jobs: { active: activeJobs },
    placements: {
      total: totalPlacements,
      thisMonth: monthlyPlacements,
      avgDaysToPlacement: Math.round(
        Array.isArray(avgTimeToPlacements) ? avgTimeToPlacements[0]?.avg_days || 0 : 0
      ),
    },
    revenue: {
      registrationFees: Number(registrationRevenue._sum.amount || 0),
      revenueShare: Number(revenueShareRevenue._sum.amount || 0),
      total: Number(totalRevenue._sum.amount || 0),
    },
    conversion: { rate: conversionRate + '%' },
  };
}

// ─────────────────────────────────────────────
// Admin Payments Dashboard
// ─────────────────────────────────────────────

export async function getPaymentsDashboard(params: {
  type?: string;
  status?: string;
  page: number;
  limit: number;
}) {
  const where: any = {};
  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;

  const [payments, total, pendingRevenueShare, defaultedCount] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        payer: { select: { email: true, phone: true, applicantProfile: { select: { fullName: true } } } },
      },
    }),
    prisma.payment.count({ where }),
    prisma.revenueShareSchedule.count({ where: { status: 'PENDING', dueDate: { lt: new Date() } } }),
    prisma.user.count({ where: { status: 'SUSPENDED' } }),
  ]);

  return { payments, total, pendingRevenueShare, defaultedCount, page: params.page, limit: params.limit };
}

export async function markPaymentPaid(adminId: string, paymentId: string) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new AppError('Payment not found', 404);

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'SUCCESS', paidAt: new Date() },
  });

  const { applyPaymentSideEffects } = await import('../payments/payment.service');
  await applyPaymentSideEffects(
    payment.id,
    payment.type,
    payment.payerId,
    payment.mediaHouseId,
    payment.amount.toNumber(),
    payment.metadata as Record<string, string> | null,
  );

  await writeAuditLog({
    userId: adminId,
    action: 'PAYMENT_MANUAL_MARK_PAID',
    entity: 'Payment',
    entityId: paymentId,
  });

  return { message: 'Payment marked as paid.' };
}

// ─────────────────────────────────────────────
// Finance Report Export
// ─────────────────────────────────────────────

export async function exportFinanceReport(format: 'csv' | 'excel' | 'pdf') {
  const payments = await prisma.payment.findMany({
    where: { status: 'SUCCESS' },
    orderBy: { paidAt: 'desc' },
    include: {
      payer: {
        select: {
          email: true,
          phone: true,
          applicantProfile: { select: { fullName: true } },
          mediaHouse: { select: { companyName: true } },
        },
      },
    },
  });

  if (format === 'excel' || format === 'csv') {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Finance Report');

    sheet.columns = [
      { header: 'Date', key: 'paidAt', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Type', key: 'type', width: 20 },
      { header: 'Amount (GHC)', key: 'amount', width: 15 },
      { header: 'Channel', key: 'channel', width: 15 },
      { header: 'Reference', key: 'ref', width: 30 },
    ];

    for (const p of payments) {
      const name = p.payer.applicantProfile?.fullName || p.payer.mediaHouse?.companyName || 'Unknown';
      sheet.addRow({
        paidAt: p.paidAt?.toISOString().substring(0, 10) || '',
        name,
        email: p.payer.email,
        type: p.type,
        amount: Number(p.amount),
        channel: p.channel || '',
        ref: p.gatewayRef || '',
      });
    }

    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    sheet.addRow({});
    sheet.addRow({ name: 'TOTAL', amount: totalAmount });

    if (format === 'csv') {
      const buffer = await workbook.csv.writeBuffer();
      return { buffer, contentType: 'text/csv', filename: 'finance-report.csv' };
    }
    const buffer = await workbook.xlsx.writeBuffer();
    return { buffer, contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: 'finance-report.xlsx' };
  }

  // PDF via pdfkit
  const PDFDocument = (await import('pdfkit')).default;
  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  doc.fontSize(18).font('Helvetica-Bold').text('MediaLink Ghana — Finance Report', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10).font('Helvetica');

  for (const p of payments) {
    const name = p.payer.applicantProfile?.fullName || p.payer.mediaHouse?.companyName || 'Unknown';
    doc.text(`${p.paidAt?.toISOString().substring(0, 10)} | ${name} | ${p.type} | GHC ${Number(p.amount).toFixed(2)} | ${p.channel || ''}`);
  }

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);
  doc.moveDown().fontSize(12).font('Helvetica-Bold').text(`TOTAL COLLECTED: GHC ${total.toFixed(2)}`);
  doc.end();

  const buffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  return { buffer, contentType: 'application/pdf', filename: 'finance-report.pdf' };
}

// ─────────────────────────────────────────────
// Job Moderation
// ─────────────────────────────────────────────

export async function getAllJobs(params: { status?: string; page: number; limit: number }) {
  const where: any = {};
  if (params.status) where.status = params.status;

  const [jobs, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employer: { select: { companyName: true, verified: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.jobListing.count({ where }),
  ]);

  return { jobs, total, page: params.page, limit: params.limit };
}

export async function moderateJob(adminId: string, jobId: string, action: 'PAUSE' | 'CLOSE' | 'ACTIVATE') {
  const statusMap = { PAUSE: 'PAUSED', CLOSE: 'CLOSED', ACTIVATE: 'ACTIVE' };
  await prisma.jobListing.update({ where: { id: jobId }, data: { status: statusMap[action] as any } });
  await writeAuditLog({ userId: adminId, action: `JOB_MODERATED_${action}`, entity: 'JobListing', entityId: jobId });
  return { message: `Job ${action.toLowerCase()}d successfully.` };
}

// ─────────────────────────────────────────────
// Broadcast Messaging (SRS §3.6)
// ─────────────────────────────────────────────

export async function sendBroadcast(
  adminId: string,
  target: 'APPLICANTS' | 'EMPLOYERS' | 'ALL',
  subject: string,
  message: string
) {
  const roleFilter =
    target === 'APPLICANTS' ? { role: 'APPLICANT' as const } :
    target === 'EMPLOYERS' ? { role: 'EMPLOYER' as const } :
    {};

  const users = await prisma.user.findMany({
    where: { ...roleFilter, status: 'ACTIVE' },
    select: { id: true, email: true, phone: true },
  });

  const emailHtml = broadcastEmail(subject, `<p>${message}</p>`);

  let sent = 0;
  const batchSize = 20;

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map((user) =>
        notify({
          recipientId: user.id,
          recipientEmail: user.email,
          type: 'BROADCAST',
          channels: ['EMAIL', 'IN_APP'],
          emailSubject: subject,
          emailHtml,
        })
      )
    );
    sent += batch.length;
  }

  await writeAuditLog({
    userId: adminId,
    action: 'BROADCAST_SENT',
    metadata: { target, subject, recipientCount: sent },
  });

  return { message: `Broadcast sent to ${sent} users.` };
}

// ─────────────────────────────────────────────
// Audit Log
// ─────────────────────────────────────────────

export async function getAuditLog(params: {
  userId?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}) {
  const where: any = {};
  if (params.userId) where.userId = params.userId;
  if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
  if (params.entity) where.entity = params.entity;
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) where.createdAt.lte = new Date(params.to);
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true, role: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page: params.page, limit: params.limit };
}

// ─────────────────────────────────────────────
// Platform Config (Skills Taxonomy, Revenue Rate)
// ─────────────────────────────────────────────

export async function getPlatformConfig() {
  const config = await prisma.platformConfig.findMany();
  return Object.fromEntries(config.map((c) => [c.key, c.value]));
}

export async function setPlatformConfig(adminId: string, key: string, value: string) {
  await prisma.platformConfig.upsert({
    where: { key },
    update: { value, updatedBy: adminId },
    create: { key, value, updatedBy: adminId },
  });
  await writeAuditLog({ userId: adminId, action: 'CONFIG_UPDATED', metadata: { key, value } });
  return { message: `Config ${key} updated.` };
}

export async function manageSkillTaxonomy(
  adminId: string,
  action: 'ADD' | 'DEACTIVATE',
  skillName: string,
  category?: string
) {
  if (action === 'ADD') {
    if (!category) throw new AppError('Category required when adding a skill', 400);
    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: { active: true, category },
      create: { name: skillName, category, active: true },
    });
    await writeAuditLog({ userId: adminId, action: 'SKILL_ADDED', metadata: { skillName, category } });
    return skill;
  } else {
    await prisma.skill.updateMany({ where: { name: skillName }, data: { active: false } });
    await writeAuditLog({ userId: adminId, action: 'SKILL_DEACTIVATED', metadata: { skillName } });
    return { message: `Skill "${skillName}" deactivated.` };
  }
}
