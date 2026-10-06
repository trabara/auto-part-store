# Medusa backend image. Build from the repository root:
#   docker build -f apps/backend/Dockerfile .

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# ---
# Partial monorepo containing only the backend and the workspaces it uses.
FROM base AS prepare
RUN yarn global add turbo@^2.7.6
COPY . .
RUN turbo prune backend --docker

# ---
FROM base AS builder
# Dependencies first (cached until a package.json or the lockfile changes)
COPY --from=prepare /app/out/json/ .
RUN yarn install --immutable
COPY --from=prepare /app/out/full/ .
# Uncomment and use build args to enable remote caching
# ARG TURBO_TEAM
# ENV TURBO_TEAM=$TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TOKEN=$TURBO_TOKEN
RUN yarn turbo run build --filter=backend...
# Runtime artifacts of the workspace packages the server loads, at the same
# relative paths as the node_modules/@repo/* symlinks expect.
RUN set -e; \
    for pkg in packages/framework packages/modules/* packages/domains/*; do \
      mkdir -p "/runtime/$pkg"; \
      cp "$pkg/package.json" "/runtime/$pkg/"; \
      if [ -d "$pkg/dist" ]; then cp -r "$pkg/dist" "/runtime/$pkg/"; fi; \
      if [ -d "$pkg/.medusa" ]; then cp -r "$pkg/.medusa" "/runtime/$pkg/"; fi; \
    done

# ---
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 medusa
USER medusa

COPY --from=builder --chown=medusa:nodejs /app/apps/backend/.medusa .medusa
COPY --from=builder --chown=medusa:nodejs /app/apps/backend/start.sh .medusa/server/start.sh
COPY --from=builder --chown=medusa:nodejs /app/node_modules .medusa/server/node_modules
COPY --from=builder --chown=medusa:nodejs /runtime/packages .medusa/server/packages

RUN chmod +x .medusa/server/start.sh

EXPOSE 9000

CMD ["sh", "-c", "cd .medusa/server && ./start.sh"]
