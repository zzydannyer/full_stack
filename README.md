# Full Stack（Vue3 + NestJS）

pnpm monorepo 模板：前端 Vue3 全家桶，后端 NestJS + Prisma，共享 TypeScript / Zod。

## 目录结构

```text
full_stack/
├── apps/
│   ├── frontend/          # Vue3 + Vite + Tailwind + Pinia + Vue Router + VueUse + vue-i18n + Axios + Zod
│   └── backend/           # NestJS ESM + Prisma + JWT + Redis + Swagger + Pino + Helmet
├── packages/
│   └── shared/            # 共享 Zod schema / 类型 / 错误码（@full-stack/shared）
├── docker-compose.yml
├── .github/workflows/ci.yml
├── pnpm-workspace.yaml
└── package.json
```

## 技术栈

| 层     | 技术                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------- |
| 包管理 | pnpm workspace                                                                                                |
| 前端   | Vue 3、Vite 8、TypeScript 6、Vue Router 5、Pinia 4、VueUse、vue-i18n、Axios、Tailwind CSS v4、shadcn-vue、Zod |
| 后端   | NestJS 11（ESM）、TypeScript 6、Prisma 7、JWT、Redis、Swagger、Pino、Throttler、Helmet、nestjs-zod           |
| 共享   | `@full-stack/shared`（Zod schema 前后端共用）                                                                 |
| 数据库 | PostgreSQL 18（`pg` + `@prisma/adapter-pg`）                                                                  |
| 缓存   | Redis（会话 / 密码重置 / Throttler）                                                                          |
| 工程化 | Oxlint、Oxfmt、Vitest、GitHub Actions、Docker Compose                                                         |

## 鉴权

- Access Token：短期 JWT（Bearer），前端保存在 `sessionStorage`
- Refresh Token：HttpOnly + Secure(生产) + SameSite=Lax Cookie，Redis 存会话（可撤销、可轮换）
- 前端 `withCredentials`，401 时自动 `/auth/refresh` 一次
- 登出清除 Cookie 与 Redis 会话
- 忘记密码：写 Redis + 开发环境在后端日志打印重置链接（暂无 SMTP）

## Zod 共享约定

- schema 只写在 `packages/shared/src`
- 后端用 `nestjs-zod` 的 `createZodDto(schema)` 包一层 DTO
- 前端页面直接 `schema.safeParse(...)`
- 改 schema 后执行：`pnpm build:shared`

## 环境要求

- Node.js >= 20.19
- pnpm >= 11
- PostgreSQL、Redis 已启动

## 快速开始

```bash
pnpm install
pnpm build:shared
pnpm db:deploy
pnpm db:seed
pnpm dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000/api
- Swagger：http://localhost:3000/api/docs
- 健康检查：http://localhost:3000/api/health

Docker（api + web + postgres + redis）：

```bash
docker compose up --build
```

- Web：http://localhost:8080
- API：http://localhost:3000/api

## 环境变量（`apps/backend/.env`）

| 变量                           | 说明                         |
| ------------------------------ | ---------------------------- |
| `NODE_ENV`                     | `development` / `production` |
| `DATABASE_URL`                 | PostgreSQL 连接串            |
| `PORT`                         | 后端端口                     |
| `FRONTEND_ORIGIN`              | CORS 来源（需 credentials）  |
| `JWT_SECRET`                   | JWT 密钥                     |
| `JWT_EXPIRES_IN`               | Access 过期（如 `15m`）      |
| `JWT_EXPIRES_SECONDS`          | Access 过期秒数（返回前端）  |
| `JWT_REFRESH_EXPIRES_SECONDS`  | Refresh Cookie / Redis TTL   |
| `REDIS_URL`                    | Redis 连接串                 |

前端：`apps/frontend/.env` → `VITE_API_BASE_URL=/api`

## API

- `GET /api/health`
- `POST /api/auth/register` `{ email, name, password }`
- `POST /api/auth/login` `{ account, password }`（account 可为用户名或邮箱）
- `POST /api/auth/refresh`（Cookie）
- `POST /api/auth/logout`（Cookie）
- `POST /api/auth/forgot-password` `{ email }`
- `POST /api/auth/reset-password` `{ token, newPassword }`
- `GET /api/auth/me` Bearer
- `GET /api/users` Bearer（admin）
- 默认管理员：账号 `admin` / 密码 `888888`（`pnpm db:seed`）

统一响应：`{ code, message, data }`，错误码见 `ErrorCode`。

## 测试（Vitest）

| 层   | 命名               | 命令             | 依赖            |
| ---- | ------------------ | ---------------- | --------------- |
| 单元 | `*.unit.test.ts`   | `pnpm test:unit` | mock，无 DB     |
| 接口 | `*.api.test.ts`    | `pnpm test:api`  | PostgreSQL+Redis |
| e2e  | `*.e2e.test.ts`    | `pnpm test:e2e`  | PostgreSQL+Redis |

- `pnpm test`：各包默认跑单元
- `pnpm test:all`：单元 + 接口 + e2e
- 新功能先列测试清单，再改代码（见 `.cursor/rules/testing.mdc`）

## 常用脚本

| 命令              | 作用                 |
| ----------------- | -------------------- |
| `pnpm dev`        | 并行启动             |
| `pnpm build`      | 构建全部             |
| `pnpm test`       | 全仓单元测试         |
| `pnpm test:unit`  | 全仓单元测试         |
| `pnpm test:api`   | 后端接口测试         |
| `pnpm test:e2e`   | 后端 e2e             |
| `pnpm test:all`   | 三层全跑             |
| `pnpm lint`       | Oxlint               |
| `pnpm format`     | Oxfmt 检查           |
| `pnpm format:fix` | Oxfmt 写入           |
| `pnpm db:deploy`  | 执行 migration       |
| `pnpm db:push`    | 同步 Prisma schema   |
| `pnpm db:migrate` | 生成并执行 migration |
| `pnpm db:seed`    | 写入管理员种子       |

## AI / 后续开发

1. 先改 `packages/shared` schema，再改前后端实现
2. 后端新业务：`apps/backend/src/<feature>/`
3. 鉴权：`JwtAuthGuard` + `@CurrentUser()`
4. Redis：注入 `REDIS_CLIENT` 或 `AuthSessionService`
5. 数据库：改 `schema.prisma` 后 `pnpm db:migrate`（原型可用 `db:push`）
6. 相对导入带 `.js` 后缀（ESM）
7. 不要提交 `.env` 与 `src/generated`
