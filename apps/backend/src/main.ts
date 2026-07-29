import "reflect-metadata"
import "dotenv/config"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import cookieParser from "cookie-parser"
import helmet from "helmet"
import { Logger } from "nestjs-pino"
import { cleanupOpenApiDoc } from "nestjs-zod"
import { AppModule } from "./app.module.js"
import { env } from "./config/env.js"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  })
  app.useLogger(app.get(Logger))
  app.use(helmet())
  app.use(cookieParser())
  app.enableCors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true,
  })
  app.setGlobalPrefix("api")

  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle("Full Stack API")
        .setDescription("Vue3 + NestJS + Prisma")
        .setVersion("0.0.1")
        .addBearerAuth()
        .build(),
    ),
  )
  SwaggerModule.setup("api/docs", app, document)

  await app.listen(env.PORT)
}

bootstrap()
