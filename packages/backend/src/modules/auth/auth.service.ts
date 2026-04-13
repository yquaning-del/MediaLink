import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { setOtp, getOtp, deleteOtp, blacklistToken, resetFailedLogins } from '../../config/redis';
import { sendSms, notify, registrationConfirmedEmail } from '../notifications/notification.service';
import { AppError } from '../../middleware/error.middleware';
import { writeAuditLog } from '../../middleware/audit.middleware';
import { JwtPayload } from '../../types';
import { Role } from '@prisma/client';
import { logger } from '../../config/logger';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

function generateTokens(userId: string, email: string, role: Role) {
  const jti = uuidv4();
  const accessToken = jwt.sign(
    { sub: userId, email, role, jti } as JwtPayload,
    env.JWT_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY }
  );
  const refreshToken = jwt.sign(
    { sub: userId, email, role, jti: uuidv4() } as JwtPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY }
  );
  return { accessToken, refreshToken, jti };
}

// ─────────────────────────────────────────────
// Applicant Registration
// ─────────────────────────────────────────────

export async function registerApplicant(data: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  referralCode?: string;
}) {
  // Check for existing users
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existing) {
    throw new AppError(
      existing.email === data.email ? 'Email already registered' : 'Phone number already registered',
      409
    );
  }

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: 'APPLICANT',
      status: 'PENDING',
      applicantProfile: {
        create: {
          fullName: data.fullName,
          completionScore: 0,
          referralCode: uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase(),
          referredBy: data.referralCode,
        },
      },
    },
  });

  // Send OTP
  const otp = generateOtp();
  await setOtp(data.phone, otp);

  await sendSms(
    data.phone,
    `Welcome to MediaLink Ghana! Your verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`
  );

  await writeAuditLog({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id });

  return { userId: user.id, message: 'OTP sent to your phone number. Please verify to continue.' };
}

// ─────────────────────────────────────────────
// Employer Registration
// ─────────────────────────────────────────────

export async function registerEmployer(data: {
  companyName: string;
  registrationNumber: string;
  industryType: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  contactName: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: data.email }, { phone: data.phone }] },
  });
  if (existing) {
    throw new AppError('Email or phone already registered', 409);
  }

  const regExists = await prisma.mediaHouse.findUnique({
    where: { registrationNumber: data.registrationNumber },
  });
  if (regExists) {
    throw new AppError('Company registration number already in use', 409);
  }

  const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      phone: data.phone,
      passwordHash,
      role: 'EMPLOYER',
      status: 'PENDING',
      mediaHouse: {
        create: {
          companyName: data.companyName,
          registrationNumber: data.registrationNumber,
          industryType: data.industryType as any,
          email: data.email,
          phone: data.phone,
          address: data.address,
          kybStatus: 'PENDING',
        },
      },
    },
  });

  // Send OTP
  const otp = generateOtp();
  await setOtp(data.phone, otp);
  await sendSms(data.phone, `MediaLink Ghana: Your verification code is ${otp}. Valid for 10 minutes.`);

  await writeAuditLog({ userId: user.id, action: 'REGISTER_EMPLOYER', entity: 'User', entityId: user.id });

  return { userId: user.id, message: 'OTP sent. Please verify your phone number.' };
}

// ─────────────────────────────────────────────
// OTP Verification
// ─────────────────────────────────────────────

export async function verifyOtp(phone: string, code: string, purpose: string) {
  const storedOtp = await getOtp(phone);
  if (!storedOtp || storedOtp !== code) {
    throw new AppError('Invalid or expired OTP. Please request a new one.', 400);
  }

  await deleteOtp(phone);

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError('User not found', 404);

  if (purpose === 'REGISTRATION') {
    // Activate user account (payment required for applicants)
    if (user.role === 'EMPLOYER') {
      // Employers don't pay registration fee — go to ACTIVE pending KYB
      await prisma.user.update({ where: { id: user.id }, data: { status: 'ACTIVE' } });
    }
    // Applicants stay PENDING until payment is confirmed
  } else if (purpose === 'PASSWORD_RESET') {
    // Store reset token in Redis temporarily
    const resetToken = uuidv4();
    const { redis } = await import('../../config/redis');
    await redis.setex(`reset:${phone}`, 600, resetToken);
    return { resetToken };
  }

  await writeAuditLog({ userId: user.id, action: 'OTP_VERIFIED', entity: 'User', entityId: user.id });
  return { verified: true, userId: user.id, role: user.role };
}

// ─────────────────────────────────────────────
// Resend OTP
// ─────────────────────────────────────────────

export async function resendOtp(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError('Phone number not registered', 404);

  const otp = generateOtp();
  await setOtp(phone, otp);
  await sendSms(phone, `MediaLink Ghana: Your new verification code is ${otp}. Valid for 10 minutes.`);

  return { message: 'OTP resent successfully.' };
}

// ─────────────────────────────────────────────
// Login
// ─────────────────────────────────────────────

export async function login(
  email: string,
  password: string,
  twoFACode?: string,
  ipAddress?: string,
  userAgent?: string
) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid email or password', 401);

  // Check account lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError('Account temporarily locked due to too many failed attempts. Try again in 15 minutes.', 429);
  }

  if (user.status === 'SUSPENDED') {
    throw new AppError('Your account has been suspended. Please contact support.', 403);
  }
  if (user.status === 'DELETED') {
    throw new AppError('Account not found', 404);
  }

  const passwordValid = await bcrypt.compare(password, user.passwordHash);
  if (!passwordValid) {
    const failCount = user.failedLoginCount + 1;
    const updates: any = { failedLoginCount: failCount };
    if (failCount >= 5) {
      updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    await prisma.user.update({ where: { id: user.id }, data: updates });
    await writeAuditLog({ userId: user.id, action: 'LOGIN_FAILED', ipAddress, userAgent });
    throw new AppError('Invalid email or password', 401);
  }

  // 2FA check — mandatory for Admin
  if (user.twoFAEnabled && user.twoFASecret) {
    if (!twoFACode) {
      throw new AppError('Two-factor authentication code required', 400);
    }
    const valid = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: twoFACode,
      window: 1,
    });
    if (!valid) {
      await writeAuditLog({ userId: user.id, action: '2FA_FAILED', ipAddress });
      throw new AppError('Invalid two-factor authentication code', 401);
    }
  }

  // Reset failed login counter
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });
  await resetFailedLogins(user.id);

  const tokens = generateTokens(user.id, user.email, user.role);

  await writeAuditLog({ userId: user.id, action: 'LOGIN', ipAddress, userAgent });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      twoFAEnabled: user.twoFAEnabled,
    },
  };
}

// ─────────────────────────────────────────────
// Refresh Token
// ─────────────────────────────────────────────

export async function refreshAccessToken(refreshToken: string) {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError('User not found or inactive', 401);
  }

  // Blacklist old refresh token
  if (payload.jti) {
    const exp = payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 86400;
    await blacklistToken(payload.jti, Math.max(exp, 0));
  }

  const tokens = generateTokens(user.id, user.email, user.role);
  return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
}

// ─────────────────────────────────────────────
// Logout
// ─────────────────────────────────────────────

export async function logout(userId: string, jti?: string) {
  if (jti) {
    await blacklistToken(jti, 1800); // 30-min access token TTL
  }
  await writeAuditLog({ userId, action: 'LOGOUT' });
}

// ─────────────────────────────────────────────
// Forgot Password
// ─────────────────────────────────────────────

export async function forgotPassword(phone: string) {
  const user = await prisma.user.findUnique({ where: { phone } });
  // Always respond positively to prevent enumeration
  if (!user) return { message: 'If your phone is registered, you will receive an OTP shortly.' };

  const otp = generateOtp();
  await setOtp(phone, otp);
  await sendSms(phone, `MediaLink Ghana: Password reset code: ${otp}. Valid for 10 minutes. Do not share.`);

  return { message: 'Password reset OTP sent to your phone number.' };
}

// ─────────────────────────────────────────────
// Reset Password
// ─────────────────────────────────────────────

export async function resetPassword(phone: string, code: string, newPassword: string) {
  const storedOtp = await getOtp(phone);
  if (!storedOtp || storedOtp !== code) {
    throw new AppError('Invalid or expired OTP', 400);
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) throw new AppError('User not found', 404);

  const passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash, failedLoginCount: 0, lockedUntil: null } });
  await deleteOtp(phone);

  await writeAuditLog({ userId: user.id, action: 'PASSWORD_RESET', entity: 'User', entityId: user.id });
  return { message: 'Password reset successfully. Please log in with your new password.' };
}

// ─────────────────────────────────────────────
// 2FA Setup
// ─────────────────────────────────────────────

export async function setup2FA(userId: string, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError('User not found', 404);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Incorrect password', 401);

  const secret = speakeasy.generateSecret({ name: `MediaLink Ghana (${user.email})`, length: 32 });
  // Temporarily store secret until verified
  const { redis } = await import('../../config/redis');
  await redis.setex(`2fa_setup:${userId}`, 300, secret.base32);

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
  return { secret: secret.base32, qrCode: qrCodeUrl };
}

export async function verify2FASetup(userId: string, token: string) {
  const { redis } = await import('../../config/redis');
  const secret = await redis.get(`2fa_setup:${userId}`);
  if (!secret) throw new AppError('2FA setup session expired. Please start again.', 400);

  const valid = speakeasy.totp.verify({ secret, encoding: 'base32', token, window: 1 });
  if (!valid) throw new AppError('Invalid TOTP code', 400);

  await prisma.user.update({ where: { id: userId }, data: { twoFAEnabled: true, twoFASecret: secret } });
  await redis.del(`2fa_setup:${userId}`);

  await writeAuditLog({ userId, action: '2FA_ENABLED' });
  return { message: 'Two-factor authentication enabled successfully.' };
}

export async function disable2FA(userId: string, token: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.twoFASecret) throw new AppError('2FA not enabled', 400);

  const valid = speakeasy.totp.verify({ secret: user.twoFASecret, encoding: 'base32', token, window: 1 });
  if (!valid) throw new AppError('Invalid TOTP code', 401);

  // Admin accounts cannot disable 2FA
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    throw new AppError('2FA is mandatory for administrator accounts and cannot be disabled.', 403);
  }

  await prisma.user.update({ where: { id: userId }, data: { twoFAEnabled: false, twoFASecret: null } });
  await writeAuditLog({ userId, action: '2FA_DISABLED' });
  return { message: 'Two-factor authentication disabled.' };
}
