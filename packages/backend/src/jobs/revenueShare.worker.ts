import { Queue, Worker, Job } from 'bullmq';
import { redis, workerRedis } from '../config/redis';
import { prisma } from '../config/database';
import { notify, revenueShareDueEmail } from '../modules/notifications/notification.service';
import { env } from '../config/env';
import { logger } from '../config/logger';
import cron from 'node-cron';

// ─────────────────────────────────────────────
// Revenue Share Queue
// ─────────────────────────────────────────────

export const revenueShareQueue = new Queue('revenue-share', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 10000 },
    removeOnComplete: 200,
    removeOnFail: 100,
  },
});

// ─────────────────────────────────────────────
// Worker
// ─────────────────────────────────────────────

export function startRevenueShareWorker(): Worker {
  const worker = new Worker(
    'revenue-share',
    async (job: Job) => {
      if (job.name === 'send-monthly-requests') {
        await sendMonthlyRevenueShareRequests();
      } else if (job.name === 'send-reminders') {
        await sendOverdueReminders();
      }
    },
    { connection: workerRedis, concurrency: 2 }
  );

  worker.on('completed', (job) => logger.debug(`Revenue share job ${job.id} completed`));
  worker.on('failed', (job, err) => logger.error(`Revenue share job ${job?.id} failed`, err));

  return worker;
}

// ─────────────────────────────────────────────
// Cron Schedule: 1st of every month at 08:00 GMT
// ─────────────────────────────────────────────

export function scheduleRevenueShareCron(): void {
  // 1st of every month at 08:00 UTC
  cron.schedule('0 8 1 * *', async () => {
    logger.info('Running monthly revenue share request job');
    await revenueShareQueue.add('send-monthly-requests', {});
  });

  // Daily at 09:00 UTC — check overdue payments
  cron.schedule('0 9 * * *', async () => {
    await revenueShareQueue.add('send-reminders', {});
  });

  logger.info('Revenue share cron jobs scheduled');
}

// ─────────────────────────────────────────────
// Monthly: Send payment requests for due schedules
// ─────────────────────────────────────────────

async function sendMonthlyRevenueShareRequests(): Promise<void> {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const dueSchedules = await prisma.revenueShareSchedule.findMany({
    where: {
      status: 'PENDING',
      dueDate: { gte: startOfDay, lt: endOfDay },
      placement: { status: 'ACTIVE' },
    },
    include: {
      placement: {
        include: {
          applicant: {
            include: { user: { select: { email: true, phone: true } } },
          },
        },
      },
    },
  });

  logger.info(`Processing ${dueSchedules.length} revenue share schedules due today`);

  for (const schedule of dueSchedules) {
    const applicant = schedule.placement.applicant;
    const user = applicant.user;
    const amount = Number(schedule.amount);
    const payLink = `${env.FRONTEND_URL}/applicant/payments/revenue-share/${schedule.placement.id}/${schedule.id}`;
    const dueDate = schedule.dueDate.toLocaleDateString('en-GH', { dateStyle: 'long' });

    await notify({
      recipientId: applicant.userId,
      recipientPhone: user.phone,
      recipientEmail: user.email,
      type: 'REVENUE_SHARE_DUE',
      channels: ['SMS', 'EMAIL', 'IN_APP'],
      smsMessage: `MediaLink Ghana: Your monthly service fee of GHC ${amount.toFixed(2)} is due today (${dueDate}). Pay now: ${payLink}`,
      emailSubject: `Monthly Service Fee Due — GHC ${amount.toFixed(2)}`,
      emailHtml: revenueShareDueEmail(
        applicant.fullName,
        amount,
        dueDate,
        payLink,
        schedule.placement.monthsRemaining
      ),
      metadata: { scheduleId: schedule.id, placementId: schedule.placementId },
    }).catch((err) => logger.error('Revenue share notification failed', err));
  }
}

// ─────────────────────────────────────────────
// Daily: Send overdue reminders (Day 1, 3, 7, 30)
// ─────────────────────────────────────────────

async function sendOverdueReminders(): Promise<void> {
  const today = new Date();

  const overdueSchedules = await prisma.revenueShareSchedule.findMany({
    where: {
      status: 'PENDING',
      dueDate: { lt: today },
      placement: { status: 'ACTIVE' },
    },
    include: {
      placement: {
        include: {
          applicant: {
            include: { user: { select: { id: true, email: true, phone: true } } },
          },
        },
      },
    },
  });

  for (const schedule of overdueSchedules) {
    const daysOverdue = Math.floor(
      (today.getTime() - schedule.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const applicant = schedule.placement.applicant;
    const user = applicant.user;
    const amount = Number(schedule.amount);
    const payLink = `${env.FRONTEND_URL}/applicant/payments/revenue-share/${schedule.placement.id}/${schedule.id}`;

    // Day 30+: Flag account for Admin review
    if (daysOverdue >= 30) {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'SUSPENDED' },
      });
      logger.warn(`Account suspended for non-payment: ${user.id} (${daysOverdue} days overdue)`);
      continue;
    }

    // Only send reminders on days 1, 3, 7
    const reminderDays = [1, 3, 7];
    if (!reminderDays.includes(daysOverdue)) continue;

    // Don't send duplicate reminders for the same day
    if (schedule.lastReminderAt) {
      const lastReminderDay = Math.floor(
        (today.getTime() - schedule.lastReminderAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (lastReminderDay < 1) continue;
    }

    const urgency = daysOverdue >= 7 ? 'URGENT: ' : '';
    await notify({
      recipientId: applicant.userId,
      recipientPhone: user.phone,
      recipientEmail: user.email,
      type: 'REVENUE_SHARE_REMINDER',
      channels: ['SMS', 'EMAIL', 'IN_APP'],
      smsMessage: `${urgency}MediaLink Ghana: Your service fee of GHC ${amount.toFixed(2)} is ${daysOverdue} day(s) overdue. Pay now to avoid account suspension: ${payLink}`,
      emailSubject: `${urgency}Payment Overdue — Action Required`,
      emailHtml: `<p>Your monthly service fee of <strong>GHC ${amount.toFixed(2)}</strong> is <strong>${daysOverdue} day(s) overdue</strong>.</p><p>Please pay immediately to avoid account restrictions: <a href="${payLink}">Pay Now</a></p>`,
      metadata: { daysOverdue, scheduleId: schedule.id },
    }).catch((err) => logger.error('Overdue reminder failed', err));

    // Update reminder tracking
    await prisma.revenueShareSchedule.update({
      where: { id: schedule.id },
      data: {
        remindersSent: { increment: 1 },
        lastReminderAt: today,
      },
    });
  }
}
