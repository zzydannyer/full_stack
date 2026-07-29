import { describe, expect, it } from "vitest"
import {
  forgotPasswordBodySchema,
  loginBodySchema,
  registerBodySchema,
  resetPasswordBodySchema,
} from "./auth.js"

describe("auth schemas", () => {
  it("accepts valid register body", () => {
    const result = registerBodySchema.parse({
      email: "a@b.com",
      name: "Alice",
      password: "123456",
    })
    expect(result.email).toBe("a@b.com")
  })

  it("rejects short password on register", () => {
    const result = registerBodySchema.safeParse({
      email: "a@b.com",
      name: "Alice",
      password: "123",
    })
    expect(result.success).toBe(false)
  })

  it("accepts account login", () => {
    const result = loginBodySchema.parse({
      account: "admin",
      password: "888888",
    })
    expect(result.account).toBe("admin")
  })

  it("accepts forgot password body", () => {
    const result = forgotPasswordBodySchema.parse({
      email: "a@b.com",
    })
    expect(result.email).toBe("a@b.com")
  })

  it("accepts reset password body", () => {
    const result = resetPasswordBodySchema.parse({
      token: "reset-token",
      newPassword: "123456",
    })
    expect(result.token).toBe("reset-token")
  })
})
