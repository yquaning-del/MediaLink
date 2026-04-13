import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { notify, placementConfirmedEmail } from '../notifications/notification.service';
import { generatePlacementAgreementPdf } from '../../utils/pdfReceipt';
import { uploadToS3 } from '../../config/s3';
import { env } from '../../config/env';
import { addMonths } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

// ─────────────────────────────────────────────
// Confirm Hiring → Create Placement
// ─────────────────────────────────────────────

export async function confirmPlacement(
  employerUserId: string,
  applicationId: string,
  data: { startDate: string; salaryAgreed: number; revenueShareRate?: number }
) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId: employerUserId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      job: true,
      applicant: { include: { user: { select: { id: true, email: true, phone: true } } } },
    },
  });

  if (!application) throw new AppError('Application not found', 404);
  if (application.job.employerId !== mediaHouse.id) throw new AppError('Forbidden', 403);
  if (application.status === 'HIRED') throw new AppError('Applicant is already placed', 400);

  const revenueShareRate = data.revenueShareRate ?? Number(env.DEFAULT_REVENUE_SHARE_RATE);
  if (revenueShareRate < 0.03 || revenueShareRate > 0.05) {
    throw new AppError('Revenue share rate must be between 3% and 5%', 400);
  }

  const startDate = new Date(data.startDate);
  const monthlyFee = data.salaryAgreed * revenueShareRate;

  // Create placement record
  const placement = await prisma.placement.create({
    data: {
      applicationId,
      applicantId: application.applicantId,
      startDate,
      salaryAgreed: data.salaryAgreed,
      revenueShareRate,
      monthsRemaining: env.REVENUE_SHARE_MONTHS,
      status: 'ACTIVE',
    },
  });

  // Generate 6-month revenue share schedule
  const schedules = Array.from({ length: env.REVENUE_SHARE_MONTHS }, (_, i) => ({
    placementId: placement.id,
    monthNumber: i + 1,
    dueDate: addMonths(startDate, i + 1),
    amount: monthlyFee,
    status: 'PENDING' as const,
  }));

  await prisma.revenueShareSchedule.createMany({ data: schedules });

  // Update application status to HIRED
  await prisma.application.update({ where: { id: applicationId }, data: { status: 'HIRED' } });

  // Generate Placement Agreement PDF
  const agreementData = {
    placementId: placement.id,
    applicantName: application.applicant.fullName,
    applicantPhone: application.applicant.user.phone,
    employerCompany: mediaHouse.companyName,
    jobTitle: application.job.title,
    startDate,
    salaryGhc: data.salaryAgreed,
    revenueShareRate,
    monthlyFeeGhc: monthlyFee,
    generatedAt: new Date(),
  };

  const pdfBuffer = await generatePlacementAgreementPdf(agreementData).catch(() => null);
  let contractUrl: string | null = null;

  if (pdfBuffer) {
    const s3Key = `contracts/${placement.id}/agreement-${uuidv4()}.pdf`;
    contractUrl = await uploadToS3(
      env.S3_BUCKET_DOCUMENTS,
      s3Key,
      pdfBuffer,
      'application/pdf'
    ).catch(() => null);

    if (contractUrl) {
      await prisma.placement.update({ where: { id: placement.id }, data: { contractUrl } });
    }
  }

  // Notify applicant
  const applicantUser = application.applicant.user;
  await notify({
    recipientId: applicantUser.id,
    recipientPhone: applicantUser.phone,
    recipientEmail: applicantUser.email,
    type: 'PLACEMENT_CONFIRMED',
    channels: ['SMS', 'EMAIL', 'IN_APP'],
    smsMessage: `MediaLink Ghana: Congratulations! You have been hired by ${mediaHouse.companyName} for ${application.job.title}. Check your email for your Placement Agreement.`,
    emailSubject: `You've Been Hired! — ${application.job.title}`,
    emailHtml: placementConfirmedEmail(
      application.applicant.fullName,
      mediaHouse.companyName,
      application.job.title,
      startDate.toLocaleDateString('en-GH', { dateStyle: 'long' })
    ),
    emailAttachments: pdfBuffer
      ? [{ content: pdfBuffer.toString('base64'), filename: 'Placement-Agreement.pdf', type: 'application/pdf', disposition: 'attachment' }]
      : undefined,
  });

  await writeAuditLog({
    userId: employerUserId,
    action: 'PLACEMENT_CONFIRMED',
    entity: 'Placement',
    entityId: placement.id,
    newValue: { salaryAgreed: data.salaryAgreed, revenueShareRate },
  });

  return { placement, contractUrl, schedule: schedules };
}

// ─────────────────────────────────────────────
// E-Sign Contract
// ─────────────────────────────────────────────

export async function signContract(userId: string, placementId: string, role: 'APPLICANT' | 'EMPLOYER') {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      applicant: { include: { user: true } },
      application: { include: { job: { include: { employer: { include: { user: true } } } } } },
    },
  });
  if (!placement) throw new AppError('Placement not found', 404);

  const applicantUserId = placement.applicant.userId;
  const employerUserId = placement.application.job.employer.userId;

  // Verify the signer is authorised
  if (role === 'APPLICANT' && applicantUserId !== userId) throw new AppError('Forbidden', 403);
  if (role === 'EMPLOYER' && employerUserId !== userId) throw new AppError('Forbidden', 403);

  const updateData: any = {};
  if (role === 'APPLICANT') {
    updateData.applicantSigned = true;
    updateData.applicantSignedAt = new Date();
  } else {
    updateData.employerSigned = true;
    updateData.employerSignedAt = new Date();
  }

  const updated = await prisma.placement.update({ where: { id: placementId }, data: updateData });

  await writeAuditLog({
    userId,
    action: `CONTRACT_SIGNED_${role}`,
    entity: 'Placement',
    entityId: placementId,
    newValue: { signedAt: new Date().toISOString() },
  });

  return { message: 'Contract signed successfully.', placement: updated };
}

// ─────────────────────────────────────────────
// Get Placement Details
// ─────────────────────────────────────────────

export async function getPlacementById(userId: string, placementId: string) {
  const placement = await prisma.placement.findUnique({
    where: { id: placementId },
    include: {
      applicant: { select: { fullName: true, userId: true } },
      application: {
        include: {
          job: { include: { employer: { select: { companyName: true, userId: true } } } },
        },
      },
      revenueShareSchedules: { orderBy: { monthNumber: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!placement) throw new AppError('Placement not found', 404);

  // Access control: only the applicant, employer, or admin
  const isApplicant = placement.applicant.userId === userId;
  const isEmployer = placement.application.job.employer.userId === userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'FINANCE';

  if (!isApplicant && !isEmployer && !isAdmin) throw new AppError('Forbidden', 403);

  return placement;
}

// ─────────────────────────────────────────────
// Get Applicant's Placements
// ─────────────────────────────────────────────

export async function getApplicantPlacements(userId: string) {
  const profile = await prisma.applicantProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError('Profile not found', 404);

  return prisma.placement.findMany({
    where: { applicantId: profile.id },
    include: {
      application: {
        include: { job: { include: { employer: { select: { companyName: true, logoUrl: true } } } } },
      },
      revenueShareSchedules: { orderBy: { monthNumber: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
