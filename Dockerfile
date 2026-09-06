# Builds one deployable image: the Express API serves both /api/* and the
# built React app, so a single service (Render, Railway, Fly.io, etc.)
# covers the whole app. Build context is the repo root.

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-build
WORKDIR /app/backend
# Prisma's engine binaries need OpenSSL to load; Alpine ships without it,
# which otherwise makes prisma generate/migrate crash with a "libssl" or
# "Could not parse schema engine response" error at runtime.
RUN apk add --no-cache openssl
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app/backend
RUN apk add --no-cache openssl
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 4000
# Applies pending migrations, optionally seeds sample data (set
# SEED_ON_BOOT=true — intended for a dev/staging service only, never prod,
# since the seed script creates accounts with published default passwords),
# then starts the server. DATABASE_URL and JWT_SECRET must be set in the
# deployment environment; for SQLite, DATABASE_URL should point at a path
# on a mounted persistent volume, or an ephemeral path if resetting the
# database on every deploy is acceptable (e.g. a preview/dev environment).
CMD ["sh", "-c", "npx prisma migrate deploy && if [ \"$SEED_ON_BOOT\" = \"true\" ]; then npm run seed; fi && node dist/index.js"]
