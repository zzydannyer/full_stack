import { ErrorCode } from "./error-code"

export function okResponse<T>(data: T) {
  return {
    code: ErrorCode.ok,
    message: "ok",
    data,
  }
}

export function failResponse(code: 10001 | 10007, message: string) {
  return {
    code,
    message,
    data: {},
  }
}
