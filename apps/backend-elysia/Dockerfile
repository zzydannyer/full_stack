FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/backend-elysia/package.json apps/backend-elysia/
RUN pnpm --filter @full-stack/backend-elysia install --frozen-lockfile

FROM oven/bun:1 AS runner
WORKDIR /app
COPY --from=deps /app/node_modules /app/node_modules
COPY --from=deps /app/apps/backend-elysia/node_modules /app/apps/backend-elysia/node_modules
COPY apps/backend-elysia/package.json apps/backend-elysia/package.json
COPY apps/backend-elysia/src apps/backend-elysia/src
WORKDIR /app/apps/backend-elysia
EXPOSE 3002
CMD ["bun", "src/index.ts"]
