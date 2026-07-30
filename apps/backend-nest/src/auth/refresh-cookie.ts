import type { Response } from "express"
import { env } from "../config/env.js"

export const refreshCookieName = "refresh_token"

export function setRefreshCookie(response: Response, token: string) {
  response.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/auth",
    maxAge: env.JWT_REFRESH_EXPIRES_SECONDS * 1000,
  })
}

export function clearRefreshCookie(response: Response) {
  response.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/auth",
  })
}
