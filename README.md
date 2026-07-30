# Full Stack（Vue3 + NestJS）

pnpm monorepo 模板：前端 Vue3 全家桶，后端 NestJS + Prisma，共享 TypeScript / Zod。

## 目录结构

```text
full_stack/
├── apps/
│   ├── frontend/          # Vue3 + Vite + Tailwind + Pinia + Vue Router + i18n + Axios + shadcn-vue
│   └── backend/           # NestJS ESM + Prisma + JWT + Redis + Swagger + Pino + Helmet
├── packages/
│   └── shared/            # 共享 Zod schema / 类型 / 错误码
├── docker-compose.yml
├── .github/workflows/ci.yml
└── package.json
```

## 鉴权与安全

- Access Token：内存中的短期 JWT（Bearer），刷新页靠 Cookie 恢复
- Refresh Token：HttpOnly Cookie（`COOKIE_SECURE` 控制 Secure），Redis 会话 + family 复用检测
- 登录 / 注册 / 忘记密码限流；Helmet；Redis Throttler；CORS credentials
- 忘记密码：配置 `SMTP_*` 发信；未配置且 `development` 时仅日志打印链接
- 用户禁用、审计日志、文件上传、`/api/metrics` Prometheus

## 快速开始

```bash
pnpm install
pnpm db:deploy
pnpm db:seed
pnpm build:shared
pnpm dev
```

- 前端：http://localhost:5173
- 后端：http://localhost:3000/api
- Swagger：http://localhost:3000/api/docs
- 健康检查：http://localhost:3000/api/health
- Metrics：http://localhost:3000/api/metrics

Docker：

```bash
JWT_SECRET=your-secret docker compose up --build
```

- Web：http://localhost:8080（HTTP 下 `COOKIE_SECURE=false`）
- 默认管理员：`admin` / `888888`（容器启动会 seed）

## 环境变量（`apps/backend/.env`）

| 变量                                     | 说明                                  |
| ---------------------------------------- | ------------------------------------- |
| `NODE_ENV`                               | development / production / test       |
| `DATABASE_URL`                           | PostgreSQL                            |
| `PORT`                                   | 后端端口                              |
| `FRONTEND_ORIGIN`                        | CORS 来源                             |
| `JWT_SECRET`                             | JWT 密钥                              |
| `JWT_EXPIRES_IN` / `JWT_EXPIRES_SECONDS` | Access 过期                           |
| `JWT_REFRESH_EXPIRES_SECONDS`            | Refresh TTL                           |
| `REDIS_URL`                              | Redis                                 |
| `COOKIE_SECURE`                          | `true` / `false`（HTTPS 生产开 true） |
| `SMTP_HOST` 等                           | 可选，配置后发重置邮件                |
| `UPLOAD_DIR`                             | 上传目录                              |

前端：`VITE_API_BASE_URL=/api`

## API（节选）

- `GET /api/health` — database + redis
- `GET /api/metrics` — Prometheus
- `POST /api/auth/register|login|refresh|logout`
- `POST /api/auth/forgot-password|reset-password`
- `GET|PATCH /api/auth/me`、`POST /api/auth/change-password`
- `GET|POST|PATCH|DELETE /api/users`（admin）
- `POST /api/uploads`、`GET /api/uploads/files/:filename`

## 测试

| 层       | 命名             | 命令                                       |
| -------- | ---------------- | ------------------------------------------ |
| 单元     | `*.unit.test.ts` | `pnpm test:unit`                           |
| 接口     | `*.api.test.ts`  | `pnpm test:api`                            |
| e2e      | `*.e2e.test.ts`  | `pnpm test:e2e`                            |
| 前端 e2e | Playwright       | `pnpm test:e2e:web`（需先 build frontend） |

`pnpm test:all` 跑后端三层。新功能先列测试清单再改代码。

## 常用脚本

| 命令                                       | 作用           |
| ------------------------------------------ | -------------- |
| `pnpm dev`                                 | 并行启动       |
| `pnpm build`                               | 构建全部       |
| `pnpm test:unit` / `test:api` / `test:e2e` | 分层测试       |
| `pnpm lint` / `pnpm format`                | Oxlint / Oxfmt |
| `pnpm db:deploy` / `db:seed`               | 迁移与种子     |
