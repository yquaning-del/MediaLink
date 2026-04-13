import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { calculateMatchScore } from '../../utils/matchScore';
import { notify } from '../notifications/notification.service';
import { env } from '../../config/env';
import { ApplicationStatus } from '@prisma/client';

// ─────────────────────────────────────────────
// Submit Application
// ─────────────────────────────────────────────

export async function submitApplication(userId: string, jobId: string, coverNote?: string) {
  // Get applicant profile
  const profile = await prisma.applicantProfile.findUnique({
    where: { userId },
    include: { workExperiences: true, user: { select: { email: true, phone: true, status: true } } },
  });

  if (!profile) throw new AppError('Applicant profile not found', 404);
  if (profile.completionScore < 60) {
    throw new AppError('Your profile must be at least 60% complete to apply for jobs', 400);
  }
  if (profile.user.status !== 'ACTIVE') {
    throw new AppError('Your account must be active to apply for jobs. Please complete registration.', 403);
  }

  // Get job listing
  const job = await prisma.jobListing.findUnique({
    where: { id: jobId },
    include: { employer: { select: { companyName: true, userId: true } } },
  });

  if (!job) throw new AppError('Job listing not found', 404);
  if (job.status !== 'ACTIVE') throw new AppError('This job is no longer accepting applications', 400);
  if (job.applicationDeadline && job.applicationDeadline < new Date()) {
    throw new AppError('Application deadline has passed', 400);
  }

  // Prevent duplicate applications
  const existing = await prisma.application.findUnique({
    where: { jobId_applicantId: { jobId, applicantId: profile.id } },
  });
  if (existing) throw new AppError('You have already applied for this position', 409);

  // Calculate match score
  const matchScore = calculateMatchScore(profile as any, job);

  // Validate cover note length
  if (coverNote && coverNote.length > 500) {
    throw new AppError('Cover note must not exceed 500 characters', 400);
  }

  const application = await prisma.application.create({
    data: {
      jobId,
      applicantId: profile.id,
      status: 'APPLIED',
      coverNote: coverNote || null,
      matchScore,
    },
    include: {
      job: {
        include: { employer: { select: { companyName: true, userId: true } } },
      },
    },
  });

  // Notify employer of new application
  const employerUser = await prisma.user.findUnique({ where: { id: job.employer.userId } });
  if (employerUser) {
    await notify({
      recipientId: employerUser.id,
      recipientEmail: employerUser.email,
      recipientPhone: employerUser.phone,
      type: 'NEW_APPLICATION',
      channels: ['EMAIL', 'IN_APP'],
      smsMessage: `MediaLink Ghana: New application received for ${job.title} from ${profile.fullName}. Review at ${env.FRONTEND_URL}/employer/applications`,
      emailSubject: `New Application — ${job.title}`,
      emailHtml: `<p>A new application has been submitted for <strong>${job.title}</strong> by <strong>${profile.fullName}</strong>.</p><p><a href="${env.FRONTEND_URL}/employer/applications">Review Application</a></p>`,
    }).catch(() => {});
  }

  await writeAuditLog({ userId, action: 'APPLICATION_SUBMITTED', entity: 'Application', entityId: application.id });
  return application;
}

// ─────────────────────────────────────────────
// Get Applicant's Applications
// ─────────────────────────────────────────────

export async function getApplicantApplications(userId: string, page: number, limit: number) {
  const profile = await prisma.applicantProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError('Profile not found', 404);

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: { applicantId: profile.id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { appliedAt: 'desc' },
      include: {
        job: {
          include: { employer: { select: { companyName: true, logoUrl: true } } },
        },
      },
    }),
    prisma.application.count({ where: { applicantId: profile.id } }),
  ]);

  return { applications, total, page, limit };
}

// ─────────────────────────────────────────────
// Get Employer's Applications for a Job
// ─────────────────────────────────────────────

export async function getJobApplications(userId: string, jobId: string, page: number, limit: number) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  // Verify job belongs to employer
  const job = await prisma.jobListing.findFirst({ where: { id: jobId, employerId: mediaHouse.id } });
  if (!job) throw new AppError('Job listing not found', 404);

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: { jobId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ matchScore: 'desc' }, { appliedAt: 'asc' }],
      include: {
        applicant: {
          select: {
            id: true,
            fullName: true,
            region: true,
            skills: true,
            completionScore: true,
            profilePhotoUrl: true,
            salaryMin: true,
            salaryMax: true,
          },
        },
      },
    }),
    prisma.application.count({ where: { jobId } }),
  ]);

  return { applications, total, page, limit };
}

// ─────────────────────────────────────────────
// Update Application Status (employer)
// ─────────────────────────────────────────────

export async function updateApplicationStatus(
  employerUserId: string,
  applicationId: string,
  newStatus: ApplicationStatus
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

  const statusMessages: Record<ApplicationStatus, string> = {
    APPLIED: 'Your application status has been updated.',
    SHORTLISTED: `Congratulations! You have been shortlisted for ${application.job.title} at ${mediaHouse.companyName}.`,
    INTERVIEWED: `You have been marked as interviewed for ${application.job.title}.`,
    OFFER_MADE: `An offer has been made for ${application.job.title} at ${mediaHouse.companyName}!`,
    HIRED: `Congratulations! You have been hired for ${application.job.title} at ${mediaHouse.companyName}!`,
    REJECTED: `Thank you for your interest. Unfortunately, we will not be proceeding with your application for ${application.job.title}.`,
  };

  await prisma.application.update({ where: { id: applicationId }, data: { status: newStatus } });

  const applicantUser = application.applicant.user;
  await notify({
    recipientId: applicantUser.id,
    recipientPhone: applicantUser.phone,
    recipientEmail: applicantUser.email,
    type: 'APPLICATION_STATUS_UPDATE',
    channels: ['SMS', 'EMAIL', 'IN_APP'],
    smsMessage: `MediaLink Ghana: ${statusMessages[newStatus]}`,
    emailSubject: `Application Update — ${application.job.title}`,
    emailHtml: `<p>${statusMessages[newStatus]}</p><p><a href="${env.FRONTEND_URL}/applicant/applications">View Your Applications</a></p>`,
    metadata: { applicationId, newStatus },
  });

  await writeAuditLog({
    userId: employerUserId,
    action: 'APPLICATION_STATUS_UPDATE',
    entity: 'Application',
    entityId: applicationId,
    newValue: { status: newStatus },
  });

  return { message: 'Application status updated.', status: newStatus };
}

// ─────────────────────────────────────────────
// Send Interview Invitation
// ─────────────────────────────────────────────

export async function sendInterviewInvitation(
  employerUserId: string,
  applicationId: string,
  details: { scheduledAt: string; format: string; location?: string; notes?: string }
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

  const scheduledDate = new Date(details.scheduledAt).toLocaleString('en-GH', {
    dateStyle: 'full', timeStyle: 'short',
  });

  const applicantUser = application.applicant.user;

  await notify({
    recipientId: applicantUser.id,
    recipientPhone: applicantUser.phone,
    recipientEmail: applicantUser.email,
    type: 'INTERVIEW_INVITATION',
    channels: ['SMS', 'EMAIL', 'IN_APP'],
    smsMessage: `MediaLink Ghana: Interview invitation from ${mediaHouse.companyName} for ${application.job.title}. Date: ${scheduledDate}. Format: ${details.format}. Check your email for details.`,
    emailSubject: `Interview Invitation — ${application.job.title}`,
    emailHtml: `
      <h2>Interview Invitation</h2>
      <p>You have been invited to interview for <strong>${application.job.title}</strong> at <strong>${mediaHouse.companyName}</strong>.</p>
      <table>
        <tr><td><strong>Date/Time:</strong></td><td>${scheduledDate}</td></tr>
        <tr><td><strong>Format:</strong></td><td>${details.format}</td></tr>
        ${details.location ? `<tr><td><strong>Location:</strong></td><td>${details.location}</td></tr>` : ''}
        ${details.notes ? `<tr><td><strong>Notes:</strong></td><td>${details.notes}</td></tr>` : ''}
      </table>
      <p>Please confirm your availability via the platform.</p>
      <a href="${env.FRONTEND_URL}/applicant/applications/${applicationId}">View & Confirm</a>
    `,
    metadata: { scheduledAt: details.scheduledAt, format: details.format },
  });

  // Update status to SHORTLISTED if still APPLIED
  if (application.status === 'APPLIED') {
    await prisma.application.update({ where: { id: applicationId }, data: { status: 'SHORTLISTED' } });
  }

  return { message: 'Interview invitation sent.' };
}
