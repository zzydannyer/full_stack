import { cors } from "@elysia/cors"
import { Elysia } from "elysia"
import { benchmark } from "./benchmark"
import { errorHandler } from "./common/error-handler"
import { frontendOrigin } from "./config/env"

export const app = new Elysia()
  .use(
    cors({
      origin: frontendOrigin,
      credentials: true,
    }),
  )
  .onError((context) => {
    if (context.code === "VALIDATION") {
      const response = errorHandler("VALIDATION", context.error.message)
      return context.status(response.status, response.body)
    }
    const response = errorHandler("INTERNAL", "Internal Server Error")
    return context.status(response.status, response.body)
  })
  .use(benchmark)
