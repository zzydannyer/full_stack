import "dotenv/config"
import { beforeEach, describe, expect, it } from "vitest"
import { isString, isUndefined } from "lodash-es"
import type Redis from "ioredis"
import { AuthSessionService } from "./auth-session.service.js"

function createRedisMock() {
  const values = new Map<string, string>()
  const sets = new Map<string, Set<string>>()

  const redis = {
    multi() {
      const ops: Array<() => number> = []
      const chain = {
        set(key: string, value: string) {
          ops.push(() => {
            values.set(key, value)
            return 1
          })
          return chain
        },
        sadd(key: string, member: string) {
          ops.push(() => {
            const current = sets.get(key) ?? new Set<string>()
            current.add(member)
            sets.set(key, current)
            return 1
          })
          return chain
        },
        expire() {
          return chain
        },
        del(key: string) {
          ops.push(() => {
            values.delete(key)
            sets.delete(key)
            return 1
          })
          return chain
        },
        srem(key: string, member: string) {
          ops.push(() => {
            const current = sets.get(key)
            if (!current) return 0
            current.delete(member)
            return 1
          })
          return chain
        },
        async exec() {
          for (const op of ops) {
            op()
          }
          return []
        },
      }
      return chain
    },
    async get(key: string) {
      return values.get(key)
    },
    async set(key: string, value: string) {
      values.set(key, value)
      return "OK"
    },
    async del(key: string) {
      values.delete(key)
      return 1
    },
    async smembers(key: string) {
      return [...(sets.get(key) ?? new Set<string>())]
    },
  }

  return { redis, values, sets }
}

describe("AuthSessionService", () => {
  let service: AuthSessionService
  let values: Map<string, string>

  beforeEach(() => {
    const mock = createRedisMock()
    values = mock.values
    service = new AuthSessionService(mock.redis as Redis)
  })

  it("creates and rotates refresh token", async () => {
    const token = await service.createRefresh("user-1")
    expect(isString(token)).toBe(true)
    expect(token.length).toBeGreaterThan(0)

    const rotated = await service.rotateRefresh(token)
    expect(isUndefined(rotated)).toBe(false)
    if (isUndefined(rotated)) return
    expect(rotated.userId).toBe("user-1")
    expect(isString(rotated.refreshToken)).toBe(true)
    expect(rotated.refreshToken).not.toBe(token)

    const reused = await service.rotateRefresh(token)
    expect(isUndefined(reused)).toBe(true)
  })

  it("revokes user sessions", async () => {
    const token = await service.createRefresh("user-2")
    await service.revokeUserSessions("user-2")
    const rotated = await service.rotateRefresh(token)
    expect(isUndefined(rotated)).toBe(true)
  })

  it("creates and consumes password reset token once", async () => {
    const token = await service.createPasswordReset("user-3")
    expect(values.size).toBeGreaterThan(0)

    const userId = await service.takePasswordReset(token)
    expect(userId).toBe("user-3")

    const again = await service.takePasswordReset(token)
    expect(isUndefined(again)).toBe(true)
  })
})
