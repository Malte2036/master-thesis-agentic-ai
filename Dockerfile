FROM node:22-alpine AS install_packages

WORKDIR /app

RUN corepack enable

# Copy root package files first
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./

COPY packages/agent-framework/package.json ./packages/agent-framework/  
COPY packages/types/package.json ./packages/types/
COPY apps/calendar-agent/package.json ./apps/calendar-agent/
COPY apps/calendar-mcp/package.json ./apps/calendar-mcp/
COPY apps/moodle-agent/package.json ./apps/moodle-agent/
COPY apps/moodle-mcp/package.json ./apps/moodle-mcp/
COPY apps/routing-agent/package.json ./apps/routing-agent/


RUN pnpm install --frozen-lockfile


# Copy source code after dependency installation for better caching
COPY scripts/dev-session.js ./scripts/dev-session.js

COPY packages ./packages
COPY apps/ ./apps/

# Build the project
RUN pnpm run build:types
RUN pnpm run build:agent-framework

EXPOSE 3000 3003 3004 1234 1235
