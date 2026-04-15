import { z } from 'zod';
import path from 'path';
import fs from 'fs';

// Load .env file manually for local dev
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0 && process.env[key.trim()] === undefined) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  JWT_ACCESS_EXPIRY: z.string().default('30m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  PAYSTACK_PUBLIC_KEY: z.string().default(''),
  PAYSTACK_SECRET_KEY: z.string().default(''),
  PAYSTACK_WEBHOOK_SECRET: z.string().default(''),
  FLUTTERWAVE_PUBLIC_KEY: z.string().default(''),
  FLUTTERWAVE_SECRET_KEY: z.string().default(''),
  TWILIO_ACCOUNT_SID: z.string().default(''),
  TWILIO_AUTH_TOKEN: z.string().default(''),
  TWILIO_PHONE_NUMBER: z.string().default(''),
  SENDGRID_API_KEY: z.string().default(''),
  SENDGRID_FROM_EMAIL: z.string().default('noreply@medialink.com.gh'),
  SENDGRID_FROM_NAME: z.string().default('MediaLink Ghana'),
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  AWS_REGION: z.string().default('eu-west-1'),
  S3_BUCKET_PROFILES: z.string().default('medialink-ghana-profiles'),
  S3_BUCKET_DOCUMENTS: z.string().default('medialink-ghana-documents'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  API_URL: z.string().default('http://localhost:4000'),
  ADMIN_ALLOWED_IPS: z.string().default('127.0.0.1,::1'),
  /** GHS smallest unit (pesewas): 100 pesewas = 1 GHS. Paystack expects this for currency GHS. */
  REGISTRATION_FEE_PESEWAS: z.coerce.number().default(5000),
  DEFAULT_REVENUE_SHARE_RATE: z.coerce.number().default(0.05),
  REVENUE_SHARE_MONTHS: z.coerce.number().default(6),
  GHANA_CARD_API_URL: z.string().default(''),
  GHANA_CARD_API_KEY: z.string().default(''),
  AI_API_URL: z.string().default('https://api.openai.com/v1'),
  AI_API_KEY: z.string().default(''),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  CORS_ORIGINS: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const adminAllowedIps = env.ADMIN_ALLOWED_IPS.split(',').map((ip) => ip.trim());

export const corsOrigins: string[] = [
  env.FRONTEND_URL,
  ...env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean),
  ...(env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://localhost:8081']
    : []),
];
