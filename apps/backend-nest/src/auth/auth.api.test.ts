import { afterAll, beforeAll, describe, expect, it } from "vitest"
import type { INestApplication } from "@nestjs/common"
import { hash } from "bcryptjs"
import { isString } from "lodash-es"
import request from "supertest"
import { closeTestApp, createTestApp } from "../../test/create-test-app.js"
import { AuthSessionService } from "./auth-session.service.js"
import { PrismaService } from "../prisma/prisma.service.js"

describe("auth api", () => {
  let app: INestApplication
  let prisma: PrismaService
  let authSession: AuthSessionService
  const disabledUsername = `disabled_${Date.now()}`
  const resetUsername = `reset_${Date.now()}`

  beforeAll(async () => {
    app = await createTestApp()
    prisma = app.get(PrismaService)
    authSession = app.get(AuthSessionService)
    const passwordHash = await hash("888888", 10)
    await prisma.user.create({
      data: {
        username: disabledUsername,
        email: `${disabledUsername}@example.com`,
        name: "disabled",
        passwordHash,
        role: "user",
        disabled: true,
      },
    })
    await prisma.user.create({
      data: {
        username: resetUsername,
        email: `${resetUsername}@example.com`,
        name: "reset",
        passwordHash,
        role: "user",
      },
    })
  })

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        username: { in: [disabledUsername, resetUsername] },
      },
    })
    await closeTestApp(app)
  })

  it("rejects invalid login", async () => {
    const res = await request(app.getHttpServer()).post("/api/auth/login").send({
      account: "admin",
      password: "wrong-password",
    })
    expect(res.status).toBe(401)
    expect(res.body.code).not.toBe(0)
  })

  it("rejects disabled user login", async () => {
    const res = await request(app.getHttpServer()).post("/api/auth/login").send({
      account: disabledUsername,
      password: "888888",
    })
    expect(res.status).toBe(401)
  })

  it("returns access token and refresh cookie on login", async () => {
    const res = await request(app.getHttpServer()).post("/api/auth/login").send({
      account: "admin",
      password: "888888",
    })
    expect(res.status).toBe(201)
    expect(res.body.code).toBe(0)
    expect(isString(res.body.data.token.accessToken)).toBe(true)
    expect(res.headers["set-cookie"]).toBeTruthy()
  })

  it("rejects refresh without cookie", async () => {
    const res = await request(app.getHttpServer()).post("/api/auth/refresh")
    expect(res.status).toBe(401)
  })

  it("rejects me without bearer token", async () => {
    const res = await request(app.getHttpServer()).get("/api/auth/me")
    expect(res.status).toBe(401)
  })

  it("accepts forgot-password for any email", async () => {
    const res = await request(app.getHttpServer()).post("/api/auth/forgot-password").send({
      email: "missing@example.com",
    })
    expect(res.status).toBe(201)
    expect(res.body.code).toBe(0)
  })

  it("rejects reset-password with invalid token", async () => {
    const res = await request(app.getHttpServer()).post("/api/auth/reset-password").send({
      token: "invalid-token",
      newPassword: "123456",
    })
    expect(res.status).toBe(401)
  })

  it("resets password with valid token then login", async () => {
    const user = await prisma.user.findUnique({ where: { username: resetUsername } })
    expect(user).toBeTruthy()
    if (!user) return
    const token = await authSession.createPasswordReset(user.id)
    const reset = await request(app.getHttpServer()).post("/api/auth/reset-password").send({
      token,
      newPassword: "654321",
    })
    expect(reset.status).toBe(201)
    const login = await request(app.getHttpServer()).post("/api/auth/login").send({
      account: resetUsername,
      password: "654321",
    })
    expect(login.status).toBe(201)
  })

  it("rejects users list without admin token", async () => {
    const res = await request(app.getHttpServer()).get("/api/users")
    expect(res.status).toBe(401)
  })
})
