import { Redis } from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

// BullMQ Workers require maxRetriesPerRequest: null for blocking commands (BLPOP)
export const workerRedis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on('error', (err) => {
  console.error('Redis error:', err.message);
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

// OTP helpers (TTL = 600s = 10 minutes)
const OTP_TTL = 600;

export async function setOtp(phone: string, code: string): Promise<void> {
  await redis.setex(`otp:${phone}`, OTP_TTL, code);
}

export async function getOtp(phone: string): Promise<string | null> {
  return redis.get(`otp:${phone}`);
}

export async function deleteOtp(phone: string): Promise<void> {
  await redis.del(`otp:${phone}`);
}

// Refresh token blacklist
export async function blacklistToken(jti: string, expirySeconds: number): Promise<void> {
  await redis.setex(`blacklist:${jti}`, expirySeconds, '1');
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const val = await redis.get(`blacklist:${jti}`);
  return val === '1';
}

// Failed login counter
export async function incrementFailedLogins(userId: string): Promise<number> {
  const key = `failed_login:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, 900); // 15 minutes window
  return count;
}

export async function resetFailedLogins(userId: string): Promise<void> {
  await redis.del(`failed_login:${userId}`);
}

export async function getFailedLogins(userId: string): Promise<number> {
  const val = await redis.get(`failed_login:${userId}`);
  return val ? parseInt(val, 10) : 0;
}
