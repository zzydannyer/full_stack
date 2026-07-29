import { z } from "zod"
import { userFieldLimit, userSchema } from "./user.js"

export const registerBodySchema = z.object({
  email: z.email(),
  name: z.string().min(userFieldLimit.nameMin).max(userFieldLimit.nameMax),
  password: z.string().min(userFieldLimit.passwordMin).max(userFieldLimit.passwordMax),
})

export const loginBodySchema = z.object({
  account: z.string().min(userFieldLimit.accountMin).max(userFieldLimit.accountMax),
  password: z.string().min(1).max(userFieldLimit.passwordMax),
})

export const forgotPasswordBodySchema = z.object({
  email: z.email(),
})

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(userFieldLimit.passwordMin).max(userFieldLimit.passwordMax),
})

export const authTokenSchema = z.object({
  accessToken: z.string(),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive(),
})

export const authSessionSchema = z.object({
  user: userSchema,
  token: authTokenSchema,
})

export const authRefreshSchema = z.object({
  token: authTokenSchema,
})

export type RegisterBody = z.infer<typeof registerBodySchema>
export type LoginBody = z.infer<typeof loginBodySchema>
export type ForgotPasswordBody = z.infer<typeof forgotPasswordBodySchema>
export type ResetPasswordBody = z.infer<typeof resetPasswordBodySchema>
export type AuthToken = z.infer<typeof authTokenSchema>
export type AuthSession = z.infer<typeof authSessionSchema>
export type AuthRefresh = z.infer<typeof authRefreshSchema>
