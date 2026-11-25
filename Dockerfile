# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS dependencies
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma/
RUN npm ci

# Stage 2: Build applications
FROM dependencies AS builder
COPY . .
RUN npm run prisma:generate --workspace=server
RUN npm run build:shared
RUN npm run build:server
RUN npm run build:client

# Stage 3: Production Server runner
FROM base AS production
ENV NODE_ENV=production
COPY package*.json ./
COPY server/package*.json ./server/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/prisma ./server/prisma
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001
CMD ["node", "server/dist/index.js"]
