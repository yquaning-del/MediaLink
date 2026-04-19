# ── Build stage ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files including lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/

# Install all deps (including devDeps for tsc)
RUN pnpm install --frozen-lockfile

# Copy backend source
COPY packages/backend ./packages/backend

# Generate Prisma client
RUN pnpm --filter backend exec prisma generate

# Compile TypeScript
RUN pnpm --filter backend build

# ── Production stage ────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# OpenSSL is required by Prisma engines on Alpine
RUN apk add --no-cache openssl

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files including lockfile
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/backend/package.json ./packages/backend/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy prisma schema and generate client against production deps
COPY packages/backend/prisma ./packages/backend/prisma
RUN pnpm --filter backend exec prisma generate

# Copy compiled output
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

WORKDIR /app/packages/backend

# Create non-root user and give it ownership of the app directory
RUN addgroup -S medialink && adduser -S medialink -G medialink \
    && chown -R medialink:medialink /app

USER medialink

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
