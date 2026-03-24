# Base stage for dependencies
FROM node:20-alpine AS base
RUN apk update
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app
# ---
FROM base AS prepare
RUN yarn global add turbo@^2.7.6
COPY . .
# Add lockfile and package.json's of isolated subworkspace
# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "medusa" is the name entered in the project's package.json: { name: "medusa" }
RUN turbo prune medusa --docker
# ---
FROM base AS builder
# First install the dependencies (as they change less often)
COPY --from=prepare /app/.yarn/releases .yarn/releases
COPY --from=prepare /app/.yarn/patches .yarn/patches
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
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 medusa
USER medusa

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=medusa:nodejs /app/apps/medusa/.medusa .medusa
COPY --from=builder --chown=medusa:nodejs /app/apps/medusa/start.sh .medusa/server/start.sh
COPY --from=builder --chown=medusa:nodejs /app/node_modules .medusa/server/node_modules
COPY --from=builder --chown=medusa:nodejs /app/packages/medusa-analytics-plugin/.medusa .medusa/server/packages/medusa-analytics-plugin/.medusa
COPY --from=builder --chown=medusa:nodejs /app/packages/medusa-analytics-plugin/package.json .medusa/server/packages/medusa-analytics-plugin/package.json
COPY --from=builder --chown=medusa:nodejs /app/packages/vehicle-fitment-plugin/.medusa .medusa/server/packages/vehicle-fitment-plugin/.medusa
COPY --from=builder --chown=medusa:nodejs /app/packages/vehicle-fitment-plugin/package.json .medusa/server/packages/vehicle-fitment-plugin/package.json
COPY --from=builder --chown=medusa:nodejs /app/packages/common/dist .medusa/server/packages/common/dist
COPY --from=builder --chown=medusa:nodejs /app/packages/common/package.json .medusa/server/packages/common/package.json

RUN chmod +x .medusa/server/start.sh

EXPOSE 9000

CMD ["sh", "-c", "cd .medusa/server && ./start.sh"]