import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { sendSuccess, getPaginationParams } from '../../utils/response';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../types';
import { AppError } from '../../middleware/error.middleware';
import { z } from 'zod';
import { validate } from '../../middleware/validate.middleware';

const router = Router();

const sendMessageSchema = z.object({
  recipientId: z.string().uuid(),
  subject: z.string().max(200).optional(),
  body: z.string().min(1).max(5000),
});

// ── Send Message ──────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  validate(sendMessageSchema),
  async (req: AuthRequest, res) => {
    const { recipientId, subject, body } = req.body as { recipientId: string; subject?: string; body: string };

    // Prevent messaging yourself
    if (recipientId === req.user!.id) {
      throw new AppError('You cannot send a message to yourself', 400);
    }

    const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
    if (!recipient || recipient.status !== 'ACTIVE') throw new AppError('Recipient not found', 404);

    const message = await prisma.message.create({
      data: {
        senderId: req.user!.id,
        recipientId,
        subject,
        body,
      },
    });

    sendSuccess(res, message, 'Message sent.', 201);
  }
);

// ── Inbox ─────────────────────────────────────────────────────
router.get(
  '/inbox',
  authenticate,
  async (req: AuthRequest, res) => {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { recipientId: req.user!.id },
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true, email: true,
              applicantProfile: { select: { fullName: true, profilePhotoUrl: true } },
              mediaHouse: { select: { companyName: true, logoUrl: true } },
            },
          },
        },
      }),
      prisma.message.count({ where: { recipientId: req.user!.id } }),
    ]);
    sendSuccess(res, messages, 'Inbox retrieved.', 200, { page, limit, total, totalPages: Math.ceil(total / limit) });
  }
);

// ── Sent ──────────────────────────────────────────────────────
router.get(
  '/sent',
  authenticate,
  async (req: AuthRequest, res) => {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { senderId: req.user!.id },
        skip,
        take: limit,
        orderBy: { sentAt: 'desc' },
        include: {
          recipient: {
            select: {
              id: true, email: true,
              applicantProfile: { select: { fullName: true, profilePhotoUrl: true } },
              mediaHouse: { select: { companyName: true, logoUrl: true } },
            },
          },
        },
      }),
      prisma.message.count({ where: { senderId: req.user!.id } }),
    ]);
    sendSuccess(res, messages, 'Sent messages retrieved.', 200, { page, limit, total });
  }
);

// ── Mark Read ─────────────────────────────────────────────────
router.patch(
  '/:id/read',
  authenticate,
  async (req: AuthRequest, res) => {
    const message = await prisma.message.findFirst({
      where: { id: req.params.id, recipientId: req.user!.id },
    });
    if (!message) throw new AppError('Message not found', 404);

    await prisma.message.update({
      where: { id: req.params.id },
      data: { read: true, readAt: new Date() },
    });

    sendSuccess(res, null, 'Message marked as read.');
  }
);

// ── Unread Count ──────────────────────────────────────────────
router.get(
  '/unread-count',
  authenticate,
  async (req: AuthRequest, res) => {
    const count = await prisma.message.count({
      where: { recipientId: req.user!.id, read: false },
    });
    sendSuccess(res, { unreadCount: count });
  }
);

export default router;
