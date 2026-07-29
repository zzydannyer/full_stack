import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis"
import { LoggerModule } from "nestjs-pino"
import { ZodValidationPipe } from "nestjs-zod"
import { AppController } from "./app.controller.js"
import { AppService } from "./app.service.js"
import { AuthModule } from "./auth/auth.module.js"
import { AllExceptionFilter } from "./common/filters/all-exception.filter.js"
import { ResponseInterceptor } from "./common/interceptors/response.interceptor.js"
import { env } from "./config/env.js"
import { PrismaModule } from "./prisma/prisma.module.js"
import { RedisModule } from "./redis/redis.module.js"
import { UserModule } from "./user/user.module.js"

const pinoTransport =
  env.NODE_ENV === "production"
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          singleLine: true,
        },
      }

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === "production" ? "info" : "debug",
        transport: pinoTransport,
      },
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 60,
        },
      ],
      storage: new ThrottlerStorageRedisService(env.REDIS_URL),
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
