import { Role } from '@prisma/client';
import { Request } from 'express';

// Authenticated request — user populated by auth middleware
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: Role;
    jti?: string;
  };
}

// Standard API response shape
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

// JWT payload
export interface JwtPayload {
  sub: string;      // user id
  email: string;
  role: Role;
  jti: string;      // unique token id for blacklisting
  iat?: number;
  exp?: number;
}

// Notification event types
export type NotificationEvent =
  | 'REGISTRATION_CONFIRMED'
  | 'OTP_SENT'
  | 'PAYMENT_RECEIPT'
  | 'PROFILE_REMINDER'
  | 'JOB_MATCH_ALERT'
  | 'INTERVIEW_INVITATION'
  | 'APPLICATION_STATUS_UPDATE'
  | 'PLACEMENT_CONFIRMED'
  | 'REVENUE_SHARE_DUE'
  | 'REVENUE_SHARE_REMINDER'
  | 'REVENUE_SHARE_COMPLETED'
  | 'KYB_APPROVED'
  | 'KYB_REJECTED'
  | 'BROADCAST';
