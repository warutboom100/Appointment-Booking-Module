# ── Stage 1: Install dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Runner ──
FROM node:22-alpine AS runner
WORKDIR /app

# Copy production node_modules and source
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
COPY seeds ./seeds

EXPOSE 4000

# Auto-migrate, seed initial mock data, then start the app
CMD ["sh", "-c", "npx tsx src/knex/migrate.ts && npx tsx src/knex/seed.ts && npx tsx src/app.ts"]
