import { Inject, Injectable } from "@nestjs/common"
import { okResponse } from "@full-stack/shared"
import { Redis } from "ioredis"
import { REDIS_CLIENT } from "./redis/redis.constants.js"

@Injectable()
export class AppService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async getHealth() {
    const redisPing = await this.redis.ping()
    return okResponse({
      status: "ok",
      redis: redisPing,
    })
  }
}
