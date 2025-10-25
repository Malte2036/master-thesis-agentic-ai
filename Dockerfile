FROM node:22-alpine AS install_packages

WORKDIR /app

RUN corepack enable

# Copy root package files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code after dependency installation for better caching
COPY scripts/dev-session.js ./scripts/dev-session.js
COPY apps/ ./apps/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the project
RUN pnpm run build:types
RUN pnpm run build:agent-framework

EXPOSE 3000 3003 3004 1234 1235
