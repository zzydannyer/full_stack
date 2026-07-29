export const ErrorCode = {
  ok: 0,
  validation: 10001,
  unauthorized: 10002,
  forbidden: 10003,
  notFound: 10004,
  conflict: 10005,
  tooManyRequests: 10006,
  internal: 10007,
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

export const errorCodeMessageKey = {
  [ErrorCode.ok]: "error.ok",
  [ErrorCode.validation]: "error.validation",
  [ErrorCode.unauthorized]: "error.unauthorized",
  [ErrorCode.forbidden]: "error.forbidden",
  [ErrorCode.notFound]: "error.notFound",
  [ErrorCode.conflict]: "error.conflict",
  [ErrorCode.tooManyRequests]: "error.tooManyRequests",
  [ErrorCode.internal]: "error.internal",
} as const satisfies Record<ErrorCodeValue, string>

export function getErrorCodeMessageKey(code: number) {
  for (const value of Object.values(ErrorCode)) {
    if (value === code) return errorCodeMessageKey[value]
  }
}
