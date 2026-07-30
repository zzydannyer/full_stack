import type { Provider } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { createPool as createMysqlPool } from "mysql2/promise"
import { Pool as PostgresqlPool } from "pg"
import { MYSQL_BENCHMARK_POOL, POSTGRESQL_BENCHMARK_POOL } from "./pool.tokens.js"

export const poolProviders: Provider[] = [
  {
    provide: POSTGRESQL_BENCHMARK_POOL,
    inject: [ConfigService],
    useFactory: (config: ConfigService) =>
      new PostgresqlPool({
        connectionString: config.getOrThrow<string>("POSTGRESQL_URL"),
      }),
  },
  {
    provide: MYSQL_BENCHMARK_POOL,
    inject: [ConfigService],
    useFactory: (config: ConfigService) =>
      createMysqlPool(config.getOrThrow<string>("MYSQL_URL")),
  },
]
