import type { INestApplication } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { ZodValidationPipe } from "nestjs-zod"
import request from "supertest"
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { AllExceptionFilter } from "../common/filters/all-exception.filter.js"
import { ResponseInterceptor } from "../common/interceptors/response.interceptor.js"
import { BenchmarkModule } from "./benchmark.module.js"
import { MYSQL_BENCHMARK_POOL, POSTGRESQL_BENCHMARK_POOL } from "./database/pool.tokens.js"

describe("Nest benchmark api", () => {
  let app: INestApplication
  const createdAt = new Date("2026-07-30T00:00:00.000Z")
  const postgresqlClient = {
    query: vi.fn<() => Promise<{ rows: object[] }>>(async () => ({ rows: [] })),
    release: vi.fn<() => undefined>(),
  }
  const postgresqlPool = {
    query: vi.fn<() => Promise<{ rows: object[] }>>(),
    connect: vi.fn<() => Promise<typeof postgresqlClient>>(async () => postgresqlClient),
    end: vi.fn<() => Promise<undefined>>(async () => undefined),
  }
  const mysqlConnection = {
    beginTransaction: vi.fn<() => Promise<undefined>>(async () => undefined),
    execute: vi.fn<() => Promise<[object, object[]]>>(async () => [{}, []]),
    commit: vi.fn<() => Promise<undefined>>(async () => undefined),
    release: vi.fn<() => undefined>(),
  }
  const mysqlPool = {
    query: vi.fn<() => Promise<[object | object[], object[]]>>(),
    execute: vi.fn<() => Promise<[object | object[], object[]]>>(),
    getConnection: vi.fn<() => Promise<typeof mysqlConnection>>(async () => mysqlConnection),
    end: vi.fn<() => Promise<undefined>>(async () => undefined),
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BenchmarkModule],
    })
      .overrideProvider(POSTGRESQL_BENCHMARK_POOL)
      .useValue(postgresqlPool)
      .overrideProvider(MYSQL_BENCHMARK_POOL)
      .useValue(mysqlPool)
      .compile()
    app = moduleRef.createNestApplication()
    app.setGlobalPrefix("api")
    app.useGlobalPipes(new ZodValidationPipe())
    app.useGlobalInterceptors(new ResponseInterceptor())
    app.useGlobalFilters(new AllExceptionFilter())
    await app.init()
  })

  beforeEach(() => {
    postgresqlClient.query.mockClear()
    postgresqlClient.release.mockClear()
    postgresqlPool.query.mockReset()
    postgresqlPool.connect.mockClear()
    mysqlConnection.beginTransaction.mockClear()
    mysqlConnection.execute.mockClear()
    mysqlConnection.commit.mockClear()
    mysqlConnection.release.mockClear()
    mysqlPool.query.mockReset()
    mysqlPool.execute.mockReset()
    mysqlPool.getConnection.mockClear()
  })

  afterAll(async () => {
    await app.close()
  })

  it("returns ping without authentication", async () => {
    const response = await request(app.getHttpServer()).get("/api/benchmark/ping")
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      code: 0,
      message: "ok",
      data: { status: "ok" },
    })
  })

  it("generates deterministic json at both size boundaries", async () => {
    const minimum = await request(app.getHttpServer()).get("/api/benchmark/json?size=1")
    const maximum = await request(app.getHttpServer()).get("/api/benchmark/json?size=50000")

    expect(minimum.status).toBe(200)
    expect(minimum.body.data).toEqual({
      count: 1,
      items: [{ index: 0, name: "record-0", active: true, score: 0 }],
    })
    expect(maximum.status).toBe(200)
    expect(maximum.body.data.count).toBe(50000)
    expect(maximum.body.data.items[49999]).toEqual({
      index: 49999,
      name: "record-49999",
      active: false,
      score: 983,
    })
  })

  it.each([
    "/api/benchmark/json",
    "/api/benchmark/json?size=0",
    "/api/benchmark/json?size=50001",
    "/api/benchmark/json?size=1.5",
    "/api/benchmark/json?size=text",
  ])("rejects invalid json size: %s", async (path) => {
    const response = await request(app.getHttpServer()).get(path)
    expect(response.status).toBe(400)
  })

  it("returns the deterministic LCG checksum", async () => {
    const first = await request(app.getHttpServer()).get("/api/benchmark/compute?iterations=1")
    const second = await request(app.getHttpServer()).get("/api/benchmark/compute?iterations=2")

    expect(first.status).toBe(200)
    expect(first.body.data).toEqual({ iterations: 1, checksum: 1013904223 })
    expect(second.status).toBe(200)
    expect(second.body.data).toEqual({ iterations: 2, checksum: 1196435762 })
  })

  it.each([
    "/api/benchmark/compute",
    "/api/benchmark/compute?iterations=0",
    "/api/benchmark/compute?iterations=50000001",
    "/api/benchmark/compute?iterations=1.5",
    "/api/benchmark/compute?iterations=text",
  ])("rejects invalid compute iterations: %s", async (path) => {
    const response = await request(app.getHttpServer()).get(path)
    expect(response.status).toBe(400)
  })

  it("reads PostgreSQL records through its pool", async () => {
    postgresqlPool.query.mockResolvedValue({
      rows: [
        {
          id: 1,
          run_id: "seed",
          payload: "benchmark-1",
          score: 1,
          created_at: createdAt,
        },
      ],
    })
    const response = await request(app.getHttpServer()).get(
      "/api/benchmark/database/read?database=postgresql&limit=1",
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      database: "postgresql",
      count: 1,
      items: [
        {
          id: 1,
          runId: "seed",
          payload: "benchmark-1",
          score: 1,
          createdAt: createdAt.toISOString(),
        },
      ],
    })
    expect(postgresqlPool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [1])
  })

  it("reads MySQL records at the maximum limit", async () => {
    mysqlPool.query.mockResolvedValue([
      [
        {
          id: 2,
          run_id: "seed",
          payload: "benchmark-2",
          score: 2,
          created_at: createdAt,
        },
      ],
      [],
    ])
    const response = await request(app.getHttpServer()).get(
      "/api/benchmark/database/read?database=mysql&limit=10000",
    )

    expect(response.status).toBe(200)
    expect(response.body.data.database).toBe("mysql")
    expect(response.body.data.count).toBe(1)
    expect(mysqlPool.query).toHaveBeenCalledWith(expect.stringContaining("SELECT"), [10000])
  })

  it.each([
    "/api/benchmark/database/read?limit=1",
    "/api/benchmark/database/read?database=sqlite&limit=1",
    "/api/benchmark/database/read?database=postgresql&limit=0",
    "/api/benchmark/database/read?database=mysql&limit=10001",
    "/api/benchmark/database/read?database=mysql",
  ])("rejects invalid database read query: %s", async (path) => {
    const response = await request(app.getHttpServer()).get(path)
    expect(response.status).toBe(400)
  })

  it("writes PostgreSQL records one by one and commits", async () => {
    const response = await request(app.getHttpServer()).post(
      "/api/benchmark/database/write?database=postgresql&count=2&runId=postgres-run",
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      database: "postgresql",
      runId: "postgres-run",
      count: 2,
    })
    expect(postgresqlClient.query).toHaveBeenNthCalledWith(1, "BEGIN")
    expect(postgresqlClient.query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        name: "insert-benchmark-record",
        values: ["postgres-run", "benchmark-0", 0],
      }),
    )
    expect(postgresqlClient.query).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        name: "insert-benchmark-record",
        values: ["postgres-run", "benchmark-1", 1],
      }),
    )
    expect(postgresqlClient.query).toHaveBeenNthCalledWith(4, "COMMIT")
    expect(postgresqlClient.release).toHaveBeenCalledOnce()
  })

  it("writes MySQL records with prepared inserts and commits", async () => {
    const response = await request(app.getHttpServer()).post(
      "/api/benchmark/database/write?database=mysql&count=1&runId=mysql-run",
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      database: "mysql",
      runId: "mysql-run",
      count: 1,
    })
    expect(mysqlConnection.beginTransaction).toHaveBeenCalledOnce()
    expect(mysqlConnection.execute).toHaveBeenCalledWith(
      "INSERT INTO benchmark_record (run_id, payload, score) VALUES (?, ?, ?)",
      ["mysql-run", "benchmark-0", 0],
    )
    expect(mysqlConnection.commit).toHaveBeenCalledOnce()
    expect(mysqlConnection.release).toHaveBeenCalledOnce()
  })

  it.each([
    "/api/benchmark/database/write?count=1&runId=run",
    "/api/benchmark/database/write?database=mysql&runId=run",
    "/api/benchmark/database/write?database=sqlite&count=1&runId=run",
    "/api/benchmark/database/write?database=mysql&count=0&runId=run",
    "/api/benchmark/database/write?database=postgresql&count=1001&runId=run",
    "/api/benchmark/database/write?database=mysql&count=1&runId=",
    `/api/benchmark/database/write?database=mysql&count=1&runId=${"r".repeat(101)}`,
  ])("rejects invalid database write query: %s", async (path) => {
    const response = await request(app.getHttpServer()).post(path)
    expect(response.status).toBe(400)
  })

  it("cleans PostgreSQL records by run id", async () => {
    postgresqlPool.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] })
    const response = await request(app.getHttpServer()).delete(
      "/api/benchmark/database/write/postgres-run?database=postgresql",
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      database: "postgresql",
      runId: "postgres-run",
      deleted: 2,
    })
  })

  it("cleans MySQL records by run id", async () => {
    mysqlPool.execute.mockResolvedValue([{ affectedRows: 3 }, []])
    const response = await request(app.getHttpServer()).delete(
      "/api/benchmark/database/write/mysql-run?database=mysql",
    )

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      database: "mysql",
      runId: "mysql-run",
      deleted: 3,
    })
  })

  it.each([
    "/api/benchmark/database/write/run",
    "/api/benchmark/database/write/run?database=sqlite",
    `/api/benchmark/database/write/${"r".repeat(101)}?database=mysql`,
  ])("rejects invalid cleanup parameters: %s", async (path) => {
    const response = await request(app.getHttpServer()).delete(path)
    expect(response.status).toBe(400)
  })
})
