import { z } from 'zod';

export const registerApplicantSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z
    .string()
    .regex(
      /^0(24|25|26|27|28|59|20|23|50|55|57)\d{7}$/,
      'Phone number must start with 024, 025, 026, 027, 028, or 059 (or other valid Ghana prefixes)'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const registerEmployerSchema = z.object({
  companyName: z.string().min(2).max(200),
  registrationNumber: z.string().min(3, 'Company registration number is required'),
  industryType: z.enum(['TV', 'RADIO', 'DIGITAL', 'PRINT', 'OUTDOOR', 'EVENTS', 'INFLUENCER_MARKETING']),
  email: z.string().email(),
  phone: z.string().regex(/^0(24|25|26|27|28|59|20|23|50|55|57)\d{7}$/, 'Invalid Ghanaian phone number'),
  address: z.string().min(5),
  password: z.string().min(8),
  confirmPassword: z.string(),
  contactName: z.string().min(2),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const verifyOtpSchema = z.object({
  phone: z.string(),
  code: z.string().length(6, 'OTP must be 6 digits'),
  purpose: z.enum(['REGISTRATION', 'LOGIN', 'PASSWORD_RESET']).default('REGISTRATION'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFACode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  phone: z.string().regex(/^0\d{9}$/),
});

export const resetPasswordSchema = z.object({
  phone: z.string(),
  code: z.string().length(6),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

export const setup2FASchema = z.object({
  password: z.string().min(1, 'Password confirmation required'),
});

export const verify2FASchema = z.object({
  token: z.string().length(6, 'TOTP code must be 6 digits'),
});

export type RegisterApplicantDto = z.infer<typeof registerApplicantSchema>;
export type RegisterEmployerDto = z.infer<typeof registerEmployerSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
