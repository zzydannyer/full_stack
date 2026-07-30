import { createHash, randomBytes } from "node:crypto"
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common"
import { Redis } from "ioredis"
import { isObject, isString } from "lodash-es"
import { env } from "../config/env.js"
import { REDIS_CLIENT } from "../redis/redis.constants.js"

type RefreshPayload = {
  userId: string
  familyId: string
}

@Injectable()
export class AuthSessionService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async createRefresh(userId: string, familyId = randomBytes(16).toString("hex")) {
    const token = randomBytes(32).toString("hex")
    const tokenHash = this.hashToken(token)
    const refreshKey = this.refreshKey(tokenHash)
    const userKey = this.userSessionsKey(userId)
    const familyKey = this.familyKey(familyId)
    const payload = JSON.stringify({ userId, familyId })
    await this.redis
      .multi()
      .set(refreshKey, payload, "EX", env.JWT_REFRESH_EXPIRES_SECONDS)
      .sadd(userKey, tokenHash)
      .expire(userKey, env.JWT_REFRESH_EXPIRES_SECONDS)
      .sadd(familyKey, tokenHash)
      .expire(familyKey, env.JWT_REFRESH_EXPIRES_SECONDS)
      .exec()
    return token
  }

  async rotateRefresh(token: string) {
    const tokenHash = this.hashToken(token)
    const refreshKey = this.refreshKey(tokenHash)
    const raw = await this.redis.get(refreshKey)
    if (!raw) {
      const reusedFamily = await this.redis.get(this.usedRefreshKey(tokenHash))
      if (isString(reusedFamily) && reusedFamily.length > 0) {
        await this.revokeFamily(reusedFamily)
        throw new UnauthorizedException("refresh token reuse detected")
      }
      return
    }

    const payload = this.parsePayload(raw)
    if (!payload) return

    await this.redis
      .multi()
      .del(refreshKey)
      .srem(this.userSessionsKey(payload.userId), tokenHash)
      .srem(this.familyKey(payload.familyId), tokenHash)
      .set(this.usedRefreshKey(tokenHash), payload.familyId, "EX", env.JWT_REFRESH_EXPIRES_SECONDS)
      .exec()

    const nextToken = await this.createRefresh(payload.userId, payload.familyId)
    return { userId: payload.userId, refreshToken: nextToken }
  }

  async revokeRefresh(token: string) {
    const tokenHash = this.hashToken(token)
    const refreshKey = this.refreshKey(tokenHash)
    const raw = await this.redis.get(refreshKey)
    if (!raw) return
    const payload = this.parsePayload(raw)
    if (!payload) return
    await this.redis
      .multi()
      .del(refreshKey)
      .srem(this.userSessionsKey(payload.userId), tokenHash)
      .srem(this.familyKey(payload.familyId), tokenHash)
      .exec()
  }

  async revokeUserSessions(userId: string) {
    const userKey = this.userSessionsKey(userId)
    const hashes = await this.redis.smembers(userKey)
    if (hashes.length === 0) {
      await this.redis.del(userKey)
      return
    }
    const multi = this.redis.multi()
    for (const tokenHash of hashes) {
      multi.del(this.refreshKey(tokenHash))
      multi.del(this.usedRefreshKey(tokenHash))
    }
    multi.del(userKey)
    await multi.exec()
  }

  async createPasswordReset(userId: string) {
    const token = randomBytes(32).toString("hex")
    const tokenHash = this.hashToken(token)
    await this.redis.set(this.resetKey(tokenHash), userId, "EX", 3600)
    return token
  }

  async takePasswordReset(token: string) {
    const tokenHash = this.hashToken(token)
    const key = this.resetKey(tokenHash)
    const userId = await this.redis.get(key)
    if (!userId) return
    await this.redis.del(key)
    return userId
  }

  private async revokeFamily(familyId: string) {
    const familyKey = this.familyKey(familyId)
    const hashes = await this.redis.smembers(familyKey)
    for (const tokenHash of hashes) {
      const raw = await this.redis.get(this.refreshKey(tokenHash))
      if (isString(raw)) {
        const payload = this.parsePayload(raw)
        if (payload) {
          await this.redis.srem(this.userSessionsKey(payload.userId), tokenHash)
        }
      }
      await this.redis.del(this.refreshKey(tokenHash))
      await this.redis.del(this.usedRefreshKey(tokenHash))
    }
    await this.redis.del(familyKey)
  }

  private parsePayload(raw: string) {
    const parsed = JSON.parse(raw)
    if (!isObject(parsed)) return
    if (!("userId" in parsed) || !("familyId" in parsed)) return
    if (!isString(parsed.userId) || !isString(parsed.familyId)) return
    const payload: RefreshPayload = {
      userId: parsed.userId,
      familyId: parsed.familyId,
    }
    return payload
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex")
  }

  private refreshKey(tokenHash: string) {
    return `auth:refresh:${tokenHash}`
  }

  private usedRefreshKey(tokenHash: string) {
    return `auth:refresh-used:${tokenHash}`
  }

  private familyKey(familyId: string) {
    return `auth:refresh-family:${familyId}`
  }

  private userSessionsKey(userId: string) {
    return `auth:user-sessions:${userId}`
  }

  private resetKey(tokenHash: string) {
    return `auth:reset:${tokenHash}`
  }
}
