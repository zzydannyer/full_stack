import { describe, expect, it } from "vitest"
import { envSchema } from "./env.schema.js"

describe("envSchema", () => {
  it("parses required env", () => {
    const result = envSchema.parse({
      DATABASE_URL: "postgresql://postgres:888888@localhost:5432/full_stack",
      PORT: "3000",
      FRONTEND_ORIGIN: "http://localhost:5173",
      JWT_SECRET: "12345678",
      JWT_EXPIRES_IN: "15m",
      JWT_EXPIRES_SECONDS: "900",
      JWT_REFRESH_EXPIRES_SECONDS: "604800",
      REDIS_URL: "redis://127.0.0.1:6379",
      COOKIE_SECURE: "false",
    })
    expect(result.PORT).toBe("3000")
    expect(result.JWT_EXPIRES_SECONDS).toBe(900)
    expect(result.JWT_REFRESH_EXPIRES_SECONDS).toBe(604800)
    expect(result.NODE_ENV).toBe("development")
    expect(result.COOKIE_SECURE).toBe(false)
  })
})
