import { Global, Module } from "@nestjs/common"
import { Redis } from "ioredis"
import { env } from "../config/env.js"
import { REDIS_CLIENT } from "./redis.constants.js"

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => new Redis(env.REDIS_URL),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
