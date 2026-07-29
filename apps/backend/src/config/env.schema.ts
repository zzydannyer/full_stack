import { z } from "zod"

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().min(1),
  PORT: z.string().min(1),
  FRONTEND_ORIGIN: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  JWT_EXPIRES_IN: z.string().min(1),
  JWT_EXPIRES_SECONDS: z.coerce.number().int().positive(),
  JWT_REFRESH_EXPIRES_SECONDS: z.coerce.number().int().positive(),
  REDIS_URL: z.string().min(1),
})

export type AppEnv = z.infer<typeof envSchema>
