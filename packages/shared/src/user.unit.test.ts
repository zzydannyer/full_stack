import { describe, expect, it } from "vitest"
import { createUserBodySchema, updateUserBodySchema, userSchema } from "./user.js"

describe("user schemas", () => {
  it("accepts user payload with disabled", () => {
    const result = userSchema.parse({
      id: "1",
      username: "admin",
      email: "admin@example.com",
      name: "admin",
      role: "admin",
      disabled: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    })
    expect(result.disabled).toBe(false)
  })

  it("accepts create user body", () => {
    const result = createUserBodySchema.parse({
      username: "bob",
      email: "bob@example.com",
      name: "Bob",
      password: "123456",
      role: "user",
    })
    expect(result.role).toBe("user")
  })

  it("requires disabled on update user body", () => {
    const result = updateUserBodySchema.safeParse({
      username: "bob",
      email: "bob@example.com",
      name: "Bob",
      role: "user",
    })
    expect(result.success).toBe(false)
  })
})
