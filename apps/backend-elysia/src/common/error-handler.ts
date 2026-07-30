import { ErrorCode } from "./error-code"
import { failResponse } from "./response"

export function errorHandler(code: "VALIDATION" | "INTERNAL", message: string) {
  if (code === "VALIDATION") {
    return {
      status: 400 as const,
      body: failResponse(ErrorCode.validation, message),
    }
  }
  return {
    status: 500 as const,
    body: failResponse(ErrorCode.internal, message),
  }
}
