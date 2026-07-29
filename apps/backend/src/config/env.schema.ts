import { z } from "zod"

const booleanString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true")

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
  COOKIE_SECURE: booleanString,
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default(""),
  UPLOAD_DIR: z.string().default("uploads"),
})

export type AppEnv = z.infer<typeof envSchema>
