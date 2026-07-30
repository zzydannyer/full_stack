import { t } from "elysia"

export type DatabaseName = "postgresql" | "mysql"

export const JsonQueryDto = t.Object({
  size: t.Numeric({ minimum: 1, maximum: 50000 }),
})

export const ComputeQueryDto = t.Object({
  iterations: t.Numeric({ minimum: 1, maximum: 50000000 }),
})

export const DatabaseReadQueryDto = t.Object({
  database: t.Union([t.Literal("postgresql"), t.Literal("mysql")]),
  limit: t.Numeric({ minimum: 1, maximum: 10000 }),
})

export const DatabaseWriteQueryDto = t.Object({
  database: t.Union([t.Literal("postgresql"), t.Literal("mysql")]),
  count: t.Numeric({ minimum: 1, maximum: 1000 }),
  runId: t.String({ minLength: 1, maxLength: 100 }),
})

export const DatabaseWriteParamsDto = t.Object({
  runId: t.String({ minLength: 1, maxLength: 100 }),
})

export const DatabaseDeleteQueryDto = t.Object({
  database: t.Union([t.Literal("postgresql"), t.Literal("mysql")]),
})
