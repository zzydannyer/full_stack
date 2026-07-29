import type {
  AuthRefresh,
  AuthSession,
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  UpdateProfileBody,
  User,
} from "@full-stack/shared"
import { http } from "./http"

export function registerApi(payload: RegisterBody) {
  return http.post<AuthSession>("/auth/register", payload)
}

export function loginApi(payload: LoginBody) {
  return http.post<AuthSession>("/auth/login", payload)
}

export function refreshApi() {
  return http.post<AuthRefresh>("/auth/refresh")
}

export function logoutApi() {
  return http.post("/auth/logout")
}

export function forgotPasswordApi(payload: ForgotPasswordBody) {
  return http.post("/auth/forgot-password", payload)
}

export function resetPasswordApi(payload: ResetPasswordBody) {
  return http.post("/auth/reset-password", payload)
}

export function fetchMeApi() {
  return http.get<User>("/auth/me")
}

export function updateProfileApi(payload: UpdateProfileBody) {
  return http.patch<User>("/auth/me", payload)
}

export function changePasswordApi(payload: ChangePasswordBody) {
  return http.post("/auth/change-password", payload)
}
