import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { INestApplication } from "@nestjs/common"
import { isString } from "lodash-es"
import request from "supertest"
import { closeTestApp, createTestApp } from "../../test/create-test-app.js"

describe("auth e2e", () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  it("login refresh and logout with cookie", async () => {
    const agent = request.agent(app.getHttpServer())
    const login = await agent.post("/api/auth/login").send({
      account: "admin",
      password: "888888",
    })
    expect(login.status).toBe(201)
    expect(login.body.code).toBe(0)
    expect(isString(login.body.data.token.accessToken)).toBe(true)
    expect(login.headers["set-cookie"]).toBeTruthy()

    const me = await agent
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.data.token.accessToken}`)
    expect(me.status).toBe(200)
    expect(me.body.data.username).toBe("admin")
    expect(me.body.data.disabled).toBe(false)

    const refresh = await agent.post("/api/auth/refresh")
    expect(refresh.status).toBe(201)
    expect(isString(refresh.body.data.token.accessToken)).toBe(true)

    const logout = await agent.post("/api/auth/logout")
    expect(logout.status).toBe(201)

    const refreshAgain = await agent.post("/api/auth/refresh")
    expect(refreshAgain.status).toBe(401)
  })
})
