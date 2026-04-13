import { Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthRequest } from '../../types';

export async function registerApplicant(req: Request, res: Response): Promise<void> {
  const result = await authService.registerApplicant(req.body);
  sendSuccess(res, result, 'Registration initiated. Please verify your phone number.', 201);
}

export async function registerEmployer(req: Request, res: Response): Promise<void> {
  const result = await authService.registerEmployer(req.body);
  sendSuccess(res, result, 'Employer registration initiated. Please verify your phone number.', 201);
}

export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { phone, code, purpose } = req.body as { phone: string; code: string; purpose: string };
  const result = await authService.verifyOtp(phone, code, purpose);
  sendSuccess(res, result, 'OTP verified successfully.');
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  const { phone } = req.body as { phone: string };
  const result = await authService.resendOtp(phone);
  sendSuccess(res, result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password, twoFACode } = req.body as { email: string; password: string; twoFACode?: string };
  const result = await authService.login(email, password, twoFACode, req.ip, req.headers['user-agent']);

  // Refresh token in HttpOnly cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',
  });

  sendSuccess(res, { accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user }, 'Login successful.');
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) {
    sendError(res, 'Refresh token required', 401);
    return;
  }
  const result = await authService.refreshAccessToken(refreshToken);
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
  sendSuccess(res, { accessToken: result.accessToken, refreshToken: result.refreshToken }, 'Token refreshed.');
}

export async function logout(req: AuthRequest, res: Response): Promise<void> {
  await authService.logout(req.user!.id, req.user!.jti);
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
  sendSuccess(res, null, 'Logged out successfully.');
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { phone } = req.body as { phone: string };
  const result = await authService.forgotPassword(phone);
  sendSuccess(res, result);
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { phone, code, newPassword } = req.body as { phone: string; code: string; newPassword: string };
  const result = await authService.resetPassword(phone, code, newPassword);
  sendSuccess(res, result);
}

export async function setup2FA(req: AuthRequest, res: Response): Promise<void> {
  const { password } = req.body as { password: string };
  const result = await authService.setup2FA(req.user!.id, password);
  sendSuccess(res, result, 'Scan the QR code with your authenticator app, then verify.');
}

export async function verify2FASetup(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.body as { token: string };
  const result = await authService.verify2FASetup(req.user!.id, token);
  sendSuccess(res, result);
}

export async function disable2FA(req: AuthRequest, res: Response): Promise<void> {
  const { token } = req.body as { token: string };
  const result = await authService.disable2FA(req.user!.id, token);
  sendSuccess(res, result);
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  const { prisma } = await import('../../config/database');
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      twoFAEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      applicantProfile: { select: { fullName: true, completionScore: true, profilePhotoUrl: true } },
      mediaHouse: { select: { companyName: true, kybStatus: true, subscriptionTier: true } },
    },
  });
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, user);
}
