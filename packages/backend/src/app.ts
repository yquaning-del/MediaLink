import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { readFileSync } from 'fs';
import { resolve } from 'path';

import { env, corsOrigins } from './config/env';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';
import { notFoundHandler, globalErrorHandler } from './middleware/error.middleware';
import { logger } from './config/logger';

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));

// Route imports
import authRoutes from './modules/auth/auth.routes';
import applicantRoutes from './modules/applicants/applicant.routes';
import employerRoutes from './modules/employers/employer.routes';
import jobRoutes from './modules/jobs/job.routes';
import applicationRoutes from './modules/applications/application.routes';
import placementRoutes from './modules/placements/placement.routes';
import paymentRoutes from './modules/payments/payment.routes';
import messagingRoutes from './modules/messaging/messaging.routes';
import adminRoutes from './modules/admin/admin.routes';
import aiRoutes from './modules/ai/ai.routes';

const app = express();

app.set('trust proxy', 1);

// ─────────────────────────────────────────────
// Security Headers
// ─────────────────────────────────────────────

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ─────────────────────────────────────────────
// CORS — allow frontend and mobile origins
// ─────────────────────────────────────────────

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─────────────────────────────────────────────
// Body Parsing & Middleware
// ─────────────────────────────────────────────

app.use('/api/payments/webhook', express.json({
  limit: '1mb',
  verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
    req.rawBody = buf;
  },
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ─────────────────────────────────────────────
// Rate Limiting
// ─────────────────────────────────────────────

app.use('/api', generalRateLimiter);

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: pkg.version,
    environment: env.NODE_ENV,
  });
});

// ─────────────────────────────────────────────
// Swagger / OpenAPI Documentation
// ─────────────────────────────────────────────

const swaggerApis =
  env.NODE_ENV === 'production'
    ? [resolve(__dirname, 'modules/**/*.routes.js')]
    : ['./src/modules/**/*.routes.ts'];

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MediaLink Ghana API',
      version: pkg.version,
      description: 'Sales Recruiter Platform — REST API Documentation',
      contact: { name: 'MediaLink Ghana', email: 'support@medialink.com.gh' },
    },
    servers: [
      { url: `${env.API_URL}/api`, description: 'API Server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: swaggerApis,
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec));

// ─────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/applicants', applicantRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/messages', messagingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// ─────────────────────────────────────────────
// Error Handling
// ─────────────────────────────────────────────

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
