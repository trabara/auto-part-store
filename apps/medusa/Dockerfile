FROM node:20-alpine AS base

# Install dependencies
RUN apk update && apk add --no-cache libc6-compat

# Tell Playwright to skip browser download
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

# Enable Corepack for Yarn
RUN corepack enable

FROM base AS builder

COPY . .

RUN npx --yes turbo@2.7.6 prune --scope=medusa --docker

FROM base AS installer

# Copy pruned workspace files
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
COPY --from=builder /app/.yarnrc.yml ./.yarnrc.yml
COPY --from=builder /app/.yarn ./.yarn

# Install dependencies
RUN yarn install

# Copy source files
COPY --from=builder /app/out/full/ .

# Build the application
RUN yarn turbo build --filter=medusa

# Clean up build artifacts and cache
RUN rm -rf node_modules/.cache .yarn/cache apps/*/node_modules/.cache

FROM base AS runner

# Set working directory for the final stage
WORKDIR /app/server

# Copy necessary files with proper ownership
COPY --chown=node:node --from=installer /app/yarn.lock ./yarn.lock
COPY --chown=node:node --from=installer /app/.yarnrc.yml ./.yarnrc.yml
COPY --chown=node:node --from=installer /app/.yarn ./.yarn
COPY --chown=node:node --from=installer /app/apps/medusa/.medusa/server ./

# Copy production node_modules from installer
COPY --chown=node:node --from=installer /app/apps/medusa/node_modules ./node_modules

# Install production dependencies only (optional optimization)
# RUN yarn workspaces focus --production && \
#     yarn cache clean

# Switch to non-root user for security
# USER node

EXPOSE 9000
ENV PORT=9000

CMD ["node_modules/.bin/medusa", "start"]