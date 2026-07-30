FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/frontend/package.json apps/frontend/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --filter @full-stack/shared --filter @full-stack/frontend --frozen-lockfile

FROM deps AS build
COPY packages/shared packages/shared
COPY apps/frontend apps/frontend
RUN pnpm install --offline --filter @full-stack/shared --filter @full-stack/frontend --frozen-lockfile
ARG VITE_API_BASE_URL=/api
ARG VITE_BACKEND_NEST_URL=/api
ARG VITE_BACKEND_AXUM_URL=/backend-axum
ARG VITE_BACKEND_ELYSIA_URL=/backend-elysia
ARG VITE_BACKEND_SPRING_URL=/backend-spring
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_BACKEND_NEST_URL=$VITE_BACKEND_NEST_URL
ENV VITE_BACKEND_AXUM_URL=$VITE_BACKEND_AXUM_URL
ENV VITE_BACKEND_ELYSIA_URL=$VITE_BACKEND_ELYSIA_URL
ENV VITE_BACKEND_SPRING_URL=$VITE_BACKEND_SPRING_URL
RUN pnpm --filter @full-stack/shared build
RUN pnpm --filter @full-stack/frontend build

FROM nginx:1.27-alpine AS runner
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
