import { Response } from 'express';
import { sendSuccess, sendError, getPaginationParams } from '../../src/utils/response';

// Minimal mock that mirrors the fluent res.status(n).json(body) pattern
function makeMockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('getPaginationParams', () => {
  it('returns defaults when query is empty', () => {
    const result = getPaginationParams({});
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('parses valid page and limit', () => {
    const result = getPaginationParams({ page: '3', limit: '10' });
    expect(result).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  it('clamps limit to 100', () => {
    const result = getPaginationParams({ limit: '500' });
    expect(result.limit).toBe(100);
  });

  it('normalises page below 1 to 1', () => {
    const result = getPaginationParams({ page: '0' });
    expect(result.page).toBe(1);
    expect(result.skip).toBe(0);
  });

  it('falls back to defaults for non-numeric strings', () => {
    const result = getPaginationParams({ page: 'abc', limit: 'xyz' });
    expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  it('calculates skip correctly for page 2 limit 15', () => {
    const result = getPaginationParams({ page: '2', limit: '15' });
    expect(result.skip).toBe(15);
  });
});

describe('sendSuccess', () => {
  it('sends 200 with correct shape by default', () => {
    const res = makeMockRes();
    sendSuccess(res, { id: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Success', data: { id: 1 }, meta: undefined });
  });

  it('uses a custom status code', () => {
    const res = makeMockRes();
    sendSuccess(res, null, 'Created', 201);
    expect(res.statusCode).toBe(201);
    expect((res.body as Record<string, unknown>).message).toBe('Created');
  });

  it('includes meta when provided', () => {
    const res = makeMockRes();
    const meta = { page: 1, limit: 20, total: 100, totalPages: 5 };
    sendSuccess(res, [], 'OK', 200, meta);
    expect((res.body as Record<string, unknown>).meta).toEqual(meta);
  });

  it('sets success to true', () => {
    const res = makeMockRes();
    sendSuccess(res, null);
    expect((res.body as Record<string, unknown>).success).toBe(true);
  });
});

describe('sendError', () => {
  it('sends 400 with correct shape by default', () => {
    const res = makeMockRes();
    sendError(res, 'Bad request');
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ success: false, message: 'Bad request', errors: undefined });
  });

  it('uses a custom status code', () => {
    const res = makeMockRes();
    sendError(res, 'Not found', 404);
    expect(res.statusCode).toBe(404);
  });

  it('includes field-level errors when provided', () => {
    const res = makeMockRes();
    const errors = { email: ['Required', 'Must be valid email'] };
    sendError(res, 'Validation failed', 422, errors);
    expect((res.body as Record<string, unknown>).errors).toEqual(errors);
  });

  it('sets success to false', () => {
    const res = makeMockRes();
    sendError(res, 'Oops');
    expect((res.body as Record<string, unknown>).success).toBe(false);
  });
});
