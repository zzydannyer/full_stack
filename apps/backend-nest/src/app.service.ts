import { Inject, Injectable } from "@nestjs/common"
import type { Health } from "@full-stack/shared"
import { okResponse } from "@full-stack/shared"
import { Redis } from "ioredis"
import { PrismaService } from "./prisma/prisma.service.js"
import { REDIS_CLIENT } from "./redis/redis.constants.js"

@Injectable()
export class AppService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly prisma: PrismaService,
  ) {}

  async getHealth() {
    const database = await this.prisma.$queryRaw`SELECT 1`.then(
      () => "up" as const,
      () => "down" as const,
    )
    const redis = await this.redis.ping().then(
      (value) => (value === "PONG" ? ("up" as const) : ("down" as const)),
      () => "down" as const,
    )
    const data: Health = {
      status: database === "up" && redis === "up" ? "ok" : "degraded",
      database,
      redis,
    }
    return okResponse(data)
  }
}
