import { z } from "zod"

export const userFieldLimit = {
  usernameMin: 1,
  usernameMax: 50,
  nameMin: 1,
  nameMax: 50,
  passwordMin: 6,
  passwordMax: 72,
  accountMin: 1,
  accountMax: 100,
} as const

export const roleSchema = z.enum(["user", "admin"])
export const roles = roleSchema.options

export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(1),
  email: z.email(),
  name: z.string().min(1),
  role: roleSchema,
  disabled: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const createUserBodySchema = z.object({
  username: z.string().min(userFieldLimit.usernameMin).max(userFieldLimit.usernameMax),
  email: z.email(),
  name: z.string().min(userFieldLimit.nameMin).max(userFieldLimit.nameMax),
  password: z.string().min(userFieldLimit.passwordMin).max(userFieldLimit.passwordMax),
  role: roleSchema,
})

export const updateUserBodySchema = z.object({
  username: z.string().min(userFieldLimit.usernameMin).max(userFieldLimit.usernameMax),
  email: z.email(),
  name: z.string().min(userFieldLimit.nameMin).max(userFieldLimit.nameMax),
  role: roleSchema,
  disabled: z.boolean(),
})

export const updateProfileBodySchema = z.object({
  name: z.string().min(userFieldLimit.nameMin).max(userFieldLimit.nameMax),
  email: z.email(),
})

export const changePasswordBodySchema = z.object({
  oldPassword: z.string().min(1).max(userFieldLimit.passwordMax),
  newPassword: z.string().min(userFieldLimit.passwordMin).max(userFieldLimit.passwordMax),
})

export type Role = z.infer<typeof roleSchema>
export type User = z.infer<typeof userSchema>
export type CreateUserBody = z.infer<typeof createUserBodySchema>
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>
