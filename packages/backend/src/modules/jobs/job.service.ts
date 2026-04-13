import { prisma } from '../../config/database';
import { AppError } from '../../middleware/error.middleware';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { matchingQueue } from '../../jobs/matching.worker';
import { CreateJobDto } from './job.schema';

// ─────────────────────────────────────────────
// Create Job Listing
// ─────────────────────────────────────────────

export async function createJob(userId: string, data: CreateJobDto) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);
  if (!mediaHouse.verified) throw new AppError('Account must be verified before posting jobs', 403);

  // Strip any HTML not from rich text editor (basic sanitisation)
  const sanitisedDescription = data.description
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');

  const job = await prisma.jobListing.create({
    data: {
      employerId: mediaHouse.id,
      title: data.title,
      department: data.department,
      jobType: data.jobType,
      location: data.location,
      region: data.region,
      remoteEligible: data.remoteEligible,
      description: sanitisedDescription,
      requiredSkills: data.requiredSkills,
      minExperienceYears: data.minExperienceYears,
      minEducationLevel: data.minEducationLevel,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
      numberOfOpenings: data.numberOfOpenings,
      status: data.status,
      expiresAt: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
    },
    include: { employer: { select: { companyName: true, industryType: true, logoUrl: true } } },
  });

  // If posted as ACTIVE immediately, trigger matching
  if (data.status === 'ACTIVE') {
    await matchingQueue.add('match-job', { jobId: job.id });
  }

  await writeAuditLog({ userId, action: 'JOB_CREATED', entity: 'JobListing', entityId: job.id });
  return job;
}

// ─────────────────────────────────────────────
// Update Job Listing
// ─────────────────────────────────────────────

export async function updateJob(userId: string, jobId: string, data: Partial<CreateJobDto>) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  const job = await prisma.jobListing.findFirst({
    where: { id: jobId, employerId: mediaHouse.id },
  });
  if (!job) throw new AppError('Job listing not found', 404);
  if (job.status === 'CLOSED') throw new AppError('Cannot edit a closed job listing', 400);

  const wasNotActive = job.status !== 'ACTIVE';

  const sanitisedDescription = data.description
    ? data.description
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
    : undefined;

  const updated = await prisma.jobListing.update({
    where: { id: jobId },
    data: {
      title: data.title,
      department: data.department,
      jobType: data.jobType,
      location: data.location,
      region: data.region,
      remoteEligible: data.remoteEligible,
      description: sanitisedDescription,
      requiredSkills: data.requiredSkills,
      minExperienceYears: data.minExperienceYears,
      minEducationLevel: data.minEducationLevel,
      salaryMin: data.salaryMin,
      salaryMax: data.salaryMax,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
      numberOfOpenings: data.numberOfOpenings,
      status: data.status,
    },
    include: { employer: { select: { companyName: true, industryType: true } } },
  });

  // Trigger matching if newly activated
  if (wasNotActive && data.status === 'ACTIVE') {
    await matchingQueue.add('match-job', { jobId });
  }

  return updated;
}

// ─────────────────────────────────────────────
// Update Job Status
// ─────────────────────────────────────────────

export async function updateJobStatus(userId: string, jobId: string, status: string) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  const job = await prisma.jobListing.findFirst({ where: { id: jobId, employerId: mediaHouse.id } });
  if (!job) throw new AppError('Job listing not found', 404);

  const wasNotActive = job.status !== 'ACTIVE';

  const updated = await prisma.jobListing.update({ where: { id: jobId }, data: { status: status as any } });

  if (wasNotActive && status === 'ACTIVE') {
    await matchingQueue.add('match-job', { jobId });
  }

  await writeAuditLog({ userId, action: `JOB_STATUS_${status}`, entity: 'JobListing', entityId: jobId });
  return updated;
}

// ─────────────────────────────────────────────
// Get Employer's Job Listings
// ─────────────────────────────────────────────

export async function getEmployerJobs(userId: string, page: number, limit: number, status?: string) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  const where: any = { employerId: mediaHouse.id };
  if (status) where.status = status;

  const [jobs, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { applications: true } },
      },
    }),
    prisma.jobListing.count({ where }),
  ]);

  return { jobs, total, page, limit };
}

// ─────────────────────────────────────────────
// Get Single Job
// ─────────────────────────────────────────────

export async function getJobById(jobId: string, incrementView = false) {
  const job = await prisma.jobListing.findUnique({
    where: { id: jobId },
    include: {
      employer: {
        select: {
          companyName: true,
          industryType: true,
          logoUrl: true,
          website: true,
          verified: true,
        },
      },
      _count: { select: { applications: true } },
    },
  });
  if (!job) throw new AppError('Job listing not found', 404);

  if (incrementView && job.status === 'ACTIVE') {
    await prisma.jobListing.update({ where: { id: jobId }, data: { viewCount: { increment: 1 } } });
  }

  return job;
}

// ─────────────────────────────────────────────
// Public Job Search
// ─────────────────────────────────────────────

export async function searchJobs(params: {
  q?: string;
  skills?: string;
  region?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  page: number;
  limit: number;
}) {
  const { q, skills, region, jobType, salaryMin, salaryMax, page, limit } = params;

  const where: any = {
    status: 'ACTIVE',
    employer: { verified: true },
  };

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (skills) {
    const skillList = skills.split(',').map((s) => s.trim());
    where.requiredSkills = { hasSome: skillList };
  }
  if (region) where.region = { contains: region, mode: 'insensitive' };
  if (jobType) where.jobType = jobType;
  if (salaryMin) where.salaryMin = { gte: salaryMin };
  if (salaryMax) where.salaryMax = { lte: salaryMax };

  const [jobs, total] = await Promise.all([
    prisma.jobListing.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      include: {
        employer: { select: { companyName: true, industryType: true, logoUrl: true } },
        _count: { select: { applications: true } },
      },
    }),
    prisma.jobListing.count({ where }),
  ]);

  return { jobs, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─────────────────────────────────────────────
// Delete Job (employer or admin)
// ─────────────────────────────────────────────

export async function deleteJob(userId: string, jobId: string) {
  const mediaHouse = await prisma.mediaHouse.findUnique({ where: { userId } });
  if (!mediaHouse) throw new AppError('Media house not found', 404);

  const job = await prisma.jobListing.findFirst({ where: { id: jobId, employerId: mediaHouse.id } });
  if (!job) throw new AppError('Job listing not found', 404);

  // Soft delete — mark as CLOSED
  await prisma.jobListing.update({ where: { id: jobId }, data: { status: 'CLOSED' } });
  await writeAuditLog({ userId, action: 'JOB_DELETED', entity: 'JobListing', entityId: jobId });
  return { message: 'Job listing closed.' };
}
