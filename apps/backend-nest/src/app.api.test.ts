import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { INestApplication } from "@nestjs/common"
import request from "supertest"
import { closeTestApp, createTestApp } from "../test/create-test-app.js"

describe("health api", () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  it("reports database and redis status", async () => {
    const res = await request(app.getHttpServer()).get("/api/health")
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(0)
    expect(res.body.data.database).toBe("up")
    expect(res.body.data.redis).toBe("up")
    expect(res.body.data.status).toBe("ok")
  })
})
