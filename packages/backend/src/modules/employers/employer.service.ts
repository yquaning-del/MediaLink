import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { notify, kybApprovedEmail } from '../notifications/notification.service';

// ─────────────────────────────────────────────
// Get Employer Profile
// ─────────────────────────────────────────────

export async function getEmployerProfile(userId: string) {
  const mediaHouse = await prisma.mediaHouse.findUnique({
    where: { userId },
    include: {
      jobListings: {
        where: { status: { not: 'CLOSED' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });
  if (!mediaHouse) throw new AppError('Media house not found', 404);
  return mediaHouse;
}

export async function updateEmployerProfile(
  userId: string,
  data: {
    companyName?: string;
    industryType?: string;
    email?: string;
    phone?: string;
    address?: string;
    logoUrl?: string;
    website?: string;
  }
) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  const updated = await prisma.mediaHouse.update({
    where: { userId },
    data: {
      companyName: data.companyName,
      industryType: data.industryType as any,
      email: data.email,
      phone: data.phone,
      address: data.address,
      logoUrl: data.logoUrl,
      website: data.website,
    },
  });

  await writeAuditLog({ userId, action: 'EMPLOYER_PROFILE_UPDATE', entity: 'MediaHouse', entityId: mediaHouse.id });
  return updated;
}

// ─────────────────────────────────────────────
// Admin: Approve/Reject KYB
// ─────────────────────────────────────────────

export async function approveEmployer(mediaHouseId: string, adminUserId: string, notes?: string) {
  const mediaHouse = await prisma.mediaHouse.findUnique({
    where: { id: mediaHouseId },
    include: { user: true },
  });
  if (!mediaHouse) throw new AppError('Media house not found', 404);
  if (mediaHouse.kybStatus === 'APPROVED') throw new AppError('Already approved', 400);

  await prisma.mediaHouse.update({
    where: { id: mediaHouseId },
    data: { kybStatus: 'APPROVED', verified: true, kybNotes: notes },
  });

  await prisma.user.update({ where: { id: mediaHouse.userId }, data: { status: 'ACTIVE' } });

  // Notify employer
  await notify({
    recipientId: mediaHouse.userId,
    recipientEmail: mediaHouse.user.email,
    recipientPhone: mediaHouse.user.phone,
    type: 'KYB_APPROVED',
    channels: ['EMAIL', 'SMS', 'IN_APP'],
    smsMessage: `MediaLink Ghana: Your media house account (${mediaHouse.companyName}) has been approved! You can now post jobs and find candidates.`,
    emailSubject: 'Account Approved — Welcome to MediaLink Ghana!',
    emailHtml: kybApprovedEmail(mediaHouse.companyName, mediaHouse.email),
  });

  await writeAuditLog({
    userId: adminUserId,
    action: 'KYB_APPROVED',
    entity: 'MediaHouse',
    entityId: mediaHouseId,
  });

  return { message: `${mediaHouse.companyName} approved successfully.` };
}

export async function rejectEmployer(mediaHouseId: string, adminUserId: string, reason: string) {
  const mediaHouse = await prisma.mediaHouse.findUnique({
    where: { id: mediaHouseId },
    include: { user: true },
  });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  await prisma.mediaHouse.update({
    where: { id: mediaHouseId },
    data: { kybStatus: 'REJECTED', kybNotes: reason },
  });

  await notify({
    recipientId: mediaHouse.userId,
    recipientEmail: mediaHouse.user.email,
    recipientPhone: mediaHouse.user.phone,
    type: 'KYB_REJECTED',
    channels: ['EMAIL', 'SMS', 'IN_APP'],
    smsMessage: `MediaLink Ghana: Your media house registration was not approved. Reason: ${reason}. Please contact support@medialink.com.gh.`,
    emailSubject: 'MediaLink Ghana — Registration Not Approved',
    emailHtml: `<p>Unfortunately, your media house registration was not approved for the following reason:</p><p><strong>${reason}</strong></p><p>Please contact support@medialink.com.gh for assistance.</p>`,
  });

  await writeAuditLog({
    userId: adminUserId,
    action: 'KYB_REJECTED',
    entity: 'MediaHouse',
    entityId: mediaHouseId,
    metadata: { reason },
  });

  return { message: `${mediaHouse.companyName} registration rejected.` };
}

// ─────────────────────────────────────────────
// Employer Analytics (job performance)
// ─────────────────────────────────────────────

export async function getEmployerAnalytics(userId: string) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  const [totalJobs, activeJobs, totalApplications, totalHires, avgDaysToFill] = await Promise.all([
    prisma.jobListing.count({ where: { employerId: mediaHouse.id } }),
    prisma.jobListing.count({ where: { employerId: mediaHouse.id, status: 'ACTIVE' } }),
    prisma.application.count({ where: { job: { employerId: mediaHouse.id } } }),
    prisma.application.count({ where: { job: { employerId: mediaHouse.id }, status: 'HIRED' } }),
    // Average days to fill = avg(hired date - job posted date)
    prisma.$queryRaw<{ avg_days: number }[]>`
      SELECT AVG(EXTRACT(EPOCH FROM (a.updated_at - j.created_at)) / 86400) as avg_days
      FROM applications a
      JOIN job_listings j ON a.job_id = j.id
      WHERE j.employer_id = ${mediaHouse.id} AND a.status = 'HIRED'
    `.catch(() => [{ avg_days: 0 }]),
  ]);

  return {
    totalJobs,
    activeJobs,
    totalApplications,
    totalHires,
    avgDaysToFill: Array.isArray(avgDaysToFill) ? Math.round(avgDaysToFill[0]?.avg_days || 0) : 0,
    conversionRate: totalApplications > 0 ? ((totalHires / totalApplications) * 100).toFixed(1) : '0.0',
  };
}
