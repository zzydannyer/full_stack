import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis"
import { LoggerModule } from "nestjs-pino"
import { ZodValidationPipe } from "nestjs-zod"
import { AppController } from "./app.controller.js"
import { AppService } from "./app.service.js"
import { AuditModule } from "./audit/audit.module.js"
import { AuthModule } from "./auth/auth.module.js"
import { BenchmarkModule } from "./benchmark/benchmark.module.js"
import { AllExceptionFilter } from "./common/filters/all-exception.filter.js"
import { ResponseInterceptor } from "./common/interceptors/response.interceptor.js"
import { env } from "./config/env.js"
import { MailModule } from "./mail/mail.module.js"
import { MetricsInterceptor } from "./metrics/metrics.interceptor.js"
import { MetricsModule } from "./metrics/metrics.module.js"
import { PrismaModule } from "./prisma/prisma.module.js"
import { RedisModule } from "./redis/redis.module.js"
import { UploadModule } from "./upload/upload.module.js"
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
    MailModule,
    AuditModule,
    MetricsModule,
    AuthModule,
    UserModule,
    BenchmarkModule,
    UploadModule,
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
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
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
