FROM node:20-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
# ---
FROM base AS prepare
# Replace <your-major-version> with the major version installed in your repository. For example:
# RUN yarn global add turbo@^2
RUN yarn global add turbo@^2.7.6
COPY . .
# Add lockfile and package.json's of isolated subworkspace
# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "storefront" is the name entered in the project's package.json: { name: "storefront" }
RUN turbo prune storefront --docker
# ---
FROM base AS builder
# First install the dependencies (as they change less often)
COPY --from=prepare /app/out/json/ .
RUN yarn install
# Build the project
COPY --from=prepare /app/out/full/ .
# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN
RUN yarn turbo build
# ---
FROM base AS runner
# Don't run production as root for security reasons
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/.next/static ./apps/storefront/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/storefront/public ./apps/storefront/public
CMD node apps/storefront/server.js