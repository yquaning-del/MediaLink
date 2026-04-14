import { Response } from 'express';
import { ApiResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
  meta?: ApiResponse<T>['meta']
): void {
  res.status(statusCode).json({ success: true, message, data, meta } as ApiResponse<T>);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: Record<string, string[]>
): void {
  res.status(statusCode).json({ success: false, message, errors } as ApiResponse);
}

export function getPaginationParams(query: Record<string, unknown>): {
  page: number;
  limit: number;
  skip: number;
} {
  const rawPage = parseInt(String(query.page || '1'), 10);
  const rawLimit = parseInt(String(query.limit || '20'), 10);
  const page = Math.max(1, isNaN(rawPage) ? 1 : rawPage);
  const limit = Math.min(100, Math.max(1, isNaN(rawLimit) ? 20 : rawLimit));
  return { page, limit, skip: (page - 1) * limit };
}
