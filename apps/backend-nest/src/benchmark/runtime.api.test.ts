import type { INestApplication } from "@nestjs/common"
import {
  performanceCleanupVO,
  performanceComputeVO,
  performanceJsonVO,
  performancePingVO,
  performanceReadVO,
  performanceWriteVO,
} from "@full-stack/shared"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import request from "supertest"
import { closeTestApp, createTestApp } from "../../test/create-test-app.js"

type RuntimeName = "nest" | "axum" | "elysia" | "spring"

const runtimeNames: RuntimeName[] = ["nest", "axum", "elysia", "spring"]
const databaseNames = ["postgresql", "mysql"] as const

describe("runtime benchmark contract", () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  function runtimeRequest(runtime: RuntimeName) {
    if (runtime === "nest") return request(app.getHttpServer())
    if (runtime === "axum") return request("http://127.0.0.1:3001")
    if (runtime === "elysia") return request("http://127.0.0.1:3002")
    return request("http://127.0.0.1:3003")
  }

  it.each(runtimeNames)("%s implements the isolated benchmark contract", async (runtime) => {
    const client = runtimeRequest(runtime)
    const ping = await client.get("/api/benchmark/ping")
    const json = await client.get("/api/benchmark/json?size=1")
    const compute = await client.get("/api/benchmark/compute?iterations=2")
    const invalid = await client.get("/api/benchmark/json?size=0")

    expect(ping.status).toBe(200)
    expect(performancePingVO.parse(ping.body.data)).toEqual({ status: "ok" })
    expect(json.status).toBe(200)
    expect(performanceJsonVO.parse(json.body.data)).toEqual({
      count: 1,
      items: [{ index: 0, name: "record-0", active: true, score: 0 }],
    })
    expect(compute.status).toBe(200)
    expect(performanceComputeVO.parse(compute.body.data)).toEqual({
      iterations: 2,
      checksum: 1196435762,
    })
    expect(invalid.status).toBe(400)
    expect(invalid.body.code).toBe(10001)
  })

  it.each(
    runtimeNames.flatMap((runtime) =>
      databaseNames.map((database) => ({ runtime, database })),
    ),
  )("$runtime implements $database read and committed write", async ({ runtime, database }) => {
    const client = runtimeRequest(runtime)
    const runId = `${runtime}-${database}-${Date.now()}`
    const read = await client.get(
      `/api/benchmark/database/read?database=${database}&limit=1`,
    )
    const write = await client.post(
      `/api/benchmark/database/write?database=${database}&count=2&runId=${runId}`,
    )
    const cleanup = await client.delete(
      `/api/benchmark/database/write/${runId}?database=${database}`,
    )

    expect(read.status).toBe(200)
    expect(performanceReadVO.parse(read.body.data).count).toBe(1)
    expect(write.status).toBe(200)
    expect(performanceWriteVO.parse(write.body.data).count).toBe(2)
    expect(cleanup.status).toBe(200)
    expect(performanceCleanupVO.parse(cleanup.body.data).deleted).toBe(2)
  })
})
