FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/backend-nest/package.json apps/backend-nest/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --filter @full-stack/shared --filter @full-stack/backend-nest --frozen-lockfile --ignore-scripts

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/backend-nest apps/backend-nest
RUN pnpm install --offline --filter @full-stack/shared --filter @full-stack/backend-nest --frozen-lockfile --ignore-scripts
RUN pnpm --filter @full-stack/shared build
RUN DATABASE_URL=postgresql://postgres:postgres@localhost:5432/full_stack pnpm --filter @full-stack/backend-nest exec prisma generate
RUN pnpm --filter @full-stack/backend-nest build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml
COPY --from=build /app/packages/shared /app/packages/shared
COPY --from=build /app/apps/backend-nest /app/apps/backend-nest
WORKDIR /app/apps/backend-nest
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm exec prisma db seed && node dist/main.js"]
