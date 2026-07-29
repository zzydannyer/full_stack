import "dotenv/config"
import type { INestApplication } from "@nestjs/common"
import { Test } from "@nestjs/testing"
import cookieParser from "cookie-parser"
import { AppModule } from "../src/app.module.js"

export async function createTestApp() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()
  const app = moduleRef.createNestApplication()
  app.use(cookieParser())
  app.setGlobalPrefix("api")
  await app.init()
  return app
}

export async function closeTestApp(app: INestApplication) {
  await app.close()
}
