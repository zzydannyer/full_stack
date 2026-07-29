import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { INestApplication } from "@nestjs/common"
import { isString } from "lodash-es"
import request from "supertest"
import { closeTestApp, createTestApp } from "../../test/create-test-app.js"

describe("users api", () => {
  let app: INestApplication
  let accessToken = ""

  beforeAll(async () => {
    app = await createTestApp()
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      account: "admin",
      password: "888888",
    })
    accessToken = login.body.data.token.accessToken
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  it("lists users for admin", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/users")
      .query({ page: 1, pageSize: 20, keyword: "admin" })
      .set("Authorization", `Bearer ${accessToken}`)
    expect(res.status).toBe(200)
    expect(res.body.code).toBe(0)
    expect(res.body.data.total).toBeGreaterThan(0)
    expect(isString(res.body.data.items[0].id)).toBe(true)
  })
})
