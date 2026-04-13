import rateLimit, { Options } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redis } from '../config/redis';
import { env } from '../config/env';

function getStore(): Partial<Options> {
  if (env.NODE_ENV === 'production') {
    return {
      store: new RedisStore({
        sendCommand: (...args: string[]) =>
          redis.call(args[0], ...args.slice(1)) as Promise<number | string | Array<string | number>>,
      }),
    };
  }
  return {};
}

/**
 * Auth endpoint rate limiter — SRS §4.3:
 * Max 5 failed attempts before 15-minute lockout.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again in 15 minutes.',
  },
  keyGenerator: (req: Request) => {
    const email = (req.body as { email?: string }).email || '';
    return `${req.ip}-${email}`;
  },
  ...getStore(),
});

/**
 * General API rate limiter — 100 requests per minute per IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  ...getStore(),
});

/**
 * Payment endpoint rate limiter — more restrictive.
 */
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many payment requests. Please try again shortly.' },
  ...getStore(),
});

/**
 * OTP request limiter — 3 OTPs per 10 minutes per phone.
 */
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes.' },
  keyGenerator: (req: Request) => {
    return (req.body as { phone?: string }).phone || req.ip || 'unknown';
  },
  ...getStore(),
});

/**
 * Admin IP whitelist middleware — SRS §7.3.
 */
export function adminIpWhitelist(allowedIps: string[]) {
  return (req: Request, res: Response, next: () => void): void => {
    const clientIp = req.ip || req.socket.remoteAddress || '';
    const normalised = clientIp.replace('::ffff:', '');
    if (!allowedIps.includes(normalised)) {
      res.status(403).json({
        success: false,
        message: 'Access denied from this IP address.',
      });
      return;
    }
    next();
  };
}
