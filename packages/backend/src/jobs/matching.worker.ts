import { Queue, Worker, Job } from 'bullmq';
import { redis, workerRedis } from '../config/redis';
import { prisma } from '../config/database';
import { calculateMatchScore, isMatchAboveThreshold } from '../utils/matchScore';
import { notify, jobMatchAlertEmail } from '../modules/notifications/notification.service';
import { env } from '../config/env';
import { logger } from '../config/logger';

// ─────────────────────────────────────────────
// Matching Queue
// ─────────────────────────────────────────────

export const matchingQueue = new Queue('matching', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

// ─────────────────────────────────────────────
// Worker: score all eligible applicants against a job
// ─────────────────────────────────────────────

export function startMatchingWorker(): Worker {
  const worker = new Worker(
    'matching',
    async (job: Job) => {
      if (job.name === 'match-job') {
        await processJobMatching(job.data.jobId as string);
      }
    },
    { connection: workerRedis, concurrency: 3 }
  );

  worker.on('completed', (job) => logger.debug(`Matching job ${job.id} completed`));
  worker.on('failed', (job, err) => logger.error(`Matching job ${job?.id} failed`, err));

  return worker;
}

async function processJobMatching(jobId: string): Promise<void> {
  const jobListing = await prisma.jobListing.findUnique({
    where: { id: jobId },
    include: { employer: { select: { companyName: true } } },
  });

  if (!jobListing || jobListing.status !== 'ACTIVE') {
    logger.debug(`Skipping matching for inactive job: ${jobId}`);
    return;
  }

  // Get all active applicants with completion >= 60%
  const applicants = await prisma.applicantProfile.findMany({
    where: {
      completionScore: { gte: 60 },
      user: { status: 'ACTIVE' },
    },
    include: { workExperiences: true, user: { select: { email: true, phone: true } } },
  });

  logger.info(`Scoring ${applicants.length} applicants for job: ${jobListing.title}`);

  const notifications: Promise<void>[] = [];

  for (const applicant of applicants) {
    const score = calculateMatchScore(applicant as any, jobListing);

    // Check if applicant already applied
    const alreadyApplied = await prisma.application.findFirst({
      where: { jobId, applicantId: applicant.id },
    });
    if (alreadyApplied) continue;

    if (isMatchAboveThreshold(score)) {
      const jobUrl = `${env.FRONTEND_URL}/applicant/jobs/${jobId}`;
      notifications.push(
        notify({
          recipientId: applicant.userId,
          recipientPhone: applicant.user.phone,
          recipientEmail: applicant.user.email,
          type: 'JOB_MATCH_ALERT',
          channels: ['SMS', 'EMAIL', 'IN_APP'],
          smsMessage: `MediaLink Ghana: New job match! ${jobListing.title} at ${jobListing.employer.companyName} (${score.toFixed(0)}% match). Apply at ${jobUrl}`,
          emailSubject: `New Job Match: ${jobListing.title}`,
          emailHtml: jobMatchAlertEmail(
            applicant.fullName,
            jobListing.title,
            jobListing.employer.companyName,
            jobUrl
          ),
          metadata: { jobId, matchScore: score },
        }).catch((err) => {
          logger.error('Match notification failed', err);
        })
      );
    }
  }

  // Process notifications in batches of 10 to avoid overwhelming the SMS gateway
  const batchSize = 10;
  for (let i = 0; i < notifications.length; i += batchSize) {
    await Promise.allSettled(notifications.slice(i, i + batchSize));
  }

  logger.info(`Matching complete for job ${jobId}: ${notifications.length} notifications queued`);
}
