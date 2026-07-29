import { createHash, randomBytes } from "node:crypto"
import { Inject, Injectable } from "@nestjs/common"
import type Redis from "ioredis"
import { env } from "../config/env.js"
import { REDIS_CLIENT } from "../redis/redis.constants.js"

@Injectable()
export class AuthSessionService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async createRefresh(userId: string) {
    const token = randomBytes(32).toString("hex")
    const tokenHash = this.hashToken(token)
    const refreshKey = this.refreshKey(tokenHash)
    const userKey = this.userSessionsKey(userId)
    await this.redis
      .multi()
      .set(refreshKey, userId, "EX", env.JWT_REFRESH_EXPIRES_SECONDS)
      .sadd(userKey, tokenHash)
      .expire(userKey, env.JWT_REFRESH_EXPIRES_SECONDS)
      .exec()
    return token
  }

  async rotateRefresh(token: string) {
    const tokenHash = this.hashToken(token)
    const userId = await this.redis.get(this.refreshKey(tokenHash))
    if (!userId) return
    await this.revokeRefresh(token)
    const nextToken = await this.createRefresh(userId)
    return { userId, refreshToken: nextToken }
  }

  async revokeRefresh(token: string) {
    const tokenHash = this.hashToken(token)
    const refreshKey = this.refreshKey(tokenHash)
    const userId = await this.redis.get(refreshKey)
    if (!userId) return
    await this.redis
      .multi()
      .del(refreshKey)
      .srem(this.userSessionsKey(userId), tokenHash)
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
    }
    multi.del(userKey)
    await multi.exec()
  }

  async createPasswordReset(userId: string) {
    const token = randomBytes(32).toString("hex")
    await this.redis.set(this.resetKey(token), userId, "EX", 3600)
    return token
  }

  async takePasswordReset(token: string) {
    const key = this.resetKey(token)
    const userId = await this.redis.get(key)
    if (!userId) return
    await this.redis.del(key)
    return userId
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex")
  }

  private refreshKey(tokenHash: string) {
    return `auth:refresh:${tokenHash}`
  }

  private userSessionsKey(userId: string) {
    return `auth:user-sessions:${userId}`
  }

  private resetKey(token: string) {
    return `auth:reset:${token}`
  }
}
