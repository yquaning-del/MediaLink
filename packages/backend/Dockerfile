# ── Build stage ────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY package.json pnpm-workspace.yaml ./
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

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace root for pnpm
COPY package.json pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy compiled output + Prisma artifacts
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/node_modules/.prisma ./packages/backend/node_modules/.prisma
COPY packages/backend/prisma ./packages/backend/prisma

WORKDIR /app/packages/backend

# Create non-root user
RUN addgroup -S medialink && adduser -S medialink -G medialink
USER medialink

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
