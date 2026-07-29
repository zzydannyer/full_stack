import { z } from "zod"
import type { ErrorCodeValue } from "./error-code.js"
import { ErrorCode } from "./error-code.js"

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    code: z.number(),
    message: z.string(),
    data: dataSchema,
  })

export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

export function okResponse<T>(data: T, message = "ok"): ApiResponse<T> {
  return {
    code: ErrorCode.ok,
    message,
    data,
  }
}

export function failResponse<T>(code: ErrorCodeValue, message: string, data: T): ApiResponse<T> {
  return {
    code,
    message,
    data,
  }
}
