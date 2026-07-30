# Full Stack（Vue3 + NestJS + Axum + Elysia + Spring Boot）

pnpm monorepo 模板：前端 Vue3 全家桶，并提供 NestJS、Rust Axum、Bun Elysia、Spring Boot 四种后端进行极限性能对比。

## 目录结构

```text
full_stack/
├── apps/
│   ├── frontend/          # Vue3 + Vite + Tailwind + Pinia + Vue Router + i18n + Axios + shadcn-vue
│   ├── backend-nest/      # NestJS ESM + Prisma + JWT + Redis + Swagger + Pino + Helmet
│   ├── backend-axum/      # Rust + Axum + SQLx
│   ├── backend-elysia/    # Bun + Elysia + Bun.SQL
│   └── backend-spring/    # Java 25 + Spring Boot 4.1 + Spring MVC + JDBC
├── packages/
│   └── shared/            # 共享 Zod 校验 / 类型 / 错误码
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
docker compose up -d postgres mysql redis
pnpm db:deploy
pnpm db:seed
pnpm dev
```

本地需安装 Bun、Rust 1.94、Java 25 和 Maven 3.6.3 以上版本。

- 前端：http://localhost:5173
- NestJS：http://localhost:3000/api
- Axum：http://localhost:3001/api
- Elysia：http://localhost:3002/api
- Spring Boot：http://localhost:3003/api
- Swagger：http://localhost:3000/api/docs
- 健康检查：http://localhost:3000/api/health
- Metrics：http://localhost:3000/api/metrics

Docker：

```bash
JWT_SECRET=your-secret docker compose up --build
```

- Web：http://localhost:8080（HTTP 下 `COOKIE_SECURE=false`）
- 默认管理员：`admin` / `888888`（容器启动会 seed）

## 环境变量（`apps/backend-nest/.env`）

| 变量                                     | 说明                                  |
| ---------------------------------------- | ------------------------------------- |
| `NODE_ENV`                               | development / production / test       |
| `DATABASE_URL`                           | PostgreSQL                            |
| `POSTGRESQL_URL`                         | 性能套件 PostgreSQL                   |
| `MYSQL_URL`                              | 性能套件 MySQL                        |
| `PORT`                                   | 后端端口                              |
| `FRONTEND_ORIGIN`                        | CORS 来源                             |
| `JWT_SECRET`                             | JWT 密钥                              |
| `JWT_EXPIRES_IN` / `JWT_EXPIRES_SECONDS` | Access 过期                           |
| `JWT_REFRESH_EXPIRES_SECONDS`            | Refresh TTL                           |
| `REDIS_URL`                              | Redis                                 |
| `COOKIE_SECURE`                          | `true` / `false`（HTTPS 生产开 true） |
| `SMTP_HOST` 等                           | 可选，配置后发重置邮件                |
| `UPLOAD_DIR`                             | 上传目录                              |

前端业务接口：`VITE_API_BASE_URL=/api`

性能对比接口：

- `VITE_BACKEND_NEST_URL=/api`
- `VITE_BACKEND_AXUM_URL=/backend-axum`
- `VITE_BACKEND_ELYSIA_URL=/backend-elysia`
- `VITE_BACKEND_SPRING_URL=/backend-spring`

四个后端使用相同的 `POSTGRESQL_URL`、`MYSQL_URL` 和专用 `benchmark_record` 数据。`pnpm db:seed` 会同时重建两个数据库的 10000 条固定基准数据。

## API（节选）

- `GET /api/health` — database + redis
- `GET /api/benchmark/ping` — 路由极限吞吐
- `GET /api/benchmark/json?size=` — 大 JSON 生成与序列化
- `GET /api/benchmark/compute?iterations=` — 固定 LCG 整数运算
- `GET /api/benchmark/database/read?database=&limit=` — PostgreSQL/MySQL 读取
- `POST /api/benchmark/database/write?database=&count=&runId=` — PostgreSQL/MySQL 事务写入
- `DELETE /api/benchmark/database/write/:runId?database=` — 清理本轮写入，不计入测量
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
| `pnpm dev:axum`                            | 启动 Axum      |
| `pnpm dev:elysia`                          | 启动 Elysia    |
| `pnpm dev:spring`                          | 启动 Spring    |
| `pnpm build`                               | 构建全部       |
| `pnpm test:unit` / `test:api` / `test:e2e` | 分层测试       |
| `pnpm lint` / `pnpm format`                | Oxlint / Oxfmt |
| `pnpm db:deploy` / `db:seed`               | 迁移与种子     |

## 性能对比说明

登录管理员后打开“极限性能套件”页面，可选择路由、JSON、CPU、数据库读取或数据库写入，并使用轻量、重载、极限三档参数同时请求四个后端。数据库项目会展开为四后端 × PostgreSQL/MySQL 的八组结果。页面展示平均延迟、p50、p95、吞吐和成功率。

数据库写入会真实提交，整轮结束后按 `runId` 清理，清理时间不计入结果。页面数据包含浏览器、代理、JSON 解析及同机资源竞争，只适合本地直观比较，不等同于独立压测工具的服务端基准结果。
