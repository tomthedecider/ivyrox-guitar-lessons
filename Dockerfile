# Builds one deployable image: the Express API serves both /api/* and the
# built React app, so a single service (Render, Railway, Fly.io, etc.)
# covers the whole app. Build context is this ivyrox/ directory.

FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:22-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app/backend
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/prisma ./prisma
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

EXPOSE 4000
# Applies pending migrations, then starts the server. DATABASE_URL and
# JWT_SECRET must be set in the deployment environment; for SQLite,
# DATABASE_URL should point at a path on a mounted persistent volume.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
