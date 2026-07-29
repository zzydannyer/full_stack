import { defineStore } from "pinia"
import { ref } from "vue"
import type {
  ChangePasswordBody,
  ForgotPasswordBody,
  LoginBody,
  RegisterBody,
  ResetPasswordBody,
  UpdateProfileBody,
  User,
} from "@full-stack/shared"
import { isString } from "lodash-es"
import {
  changePasswordApi,
  fetchMeApi,
  forgotPasswordApi,
  loginApi,
  logoutApi,
  refreshApi,
  registerApi,
  resetPasswordApi,
  updateProfileApi,
} from "@/api/auth"
import { writeAccessToken } from "@/api/http"

function readStoredToken() {
  const stored = sessionStorage.getItem("accessToken")
  if (isString(stored)) return stored
  return ""
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User>()
  const accessToken = ref(readStoredToken())
  const loading = ref(false)

  function setToken(token: string) {
    accessToken.value = token
    writeAccessToken(token)
  }

  function clearLocalAuth() {
    user.value = undefined
    accessToken.value = ""
    writeAccessToken("")
  }

  async function ensureSession() {
    if (accessToken.value.length > 0) return true
    loading.value = true
    return refreshApi()
      .then(
        (res) => {
          setToken(res.data.token.accessToken)
          return true
        },
        () => false,
      )
      .finally(() => {
        loading.value = false
      })
  }

  async function register(payload: RegisterBody) {
    loading.value = true
    return registerApi(payload)
      .then((res) => {
        setToken(res.data.token.accessToken)
        user.value = res.data.user
      })
      .finally(() => {
        loading.value = false
      })
  }

  async function login(payload: LoginBody) {
    loading.value = true
    return loginApi(payload)
      .then((res) => {
        setToken(res.data.token.accessToken)
        user.value = res.data.user
      })
      .finally(() => {
        loading.value = false
      })
  }

  async function loadMe() {
    if (accessToken.value.length === 0) return
    loading.value = true
    return fetchMeApi()
      .then((res) => {
        user.value = res.data
      })
      .finally(() => {
        loading.value = false
      })
  }

  async function updateProfile(payload: UpdateProfileBody) {
    loading.value = true
    return updateProfileApi(payload)
      .then((res) => {
        user.value = res.data
      })
      .finally(() => {
        loading.value = false
      })
  }

  async function changePassword(payload: ChangePasswordBody) {
    loading.value = true
    return changePasswordApi(payload).finally(() => {
      loading.value = false
    })
  }

  async function forgotPassword(payload: ForgotPasswordBody) {
    loading.value = true
    return forgotPasswordApi(payload).finally(() => {
      loading.value = false
    })
  }

  async function resetPassword(payload: ResetPasswordBody) {
    loading.value = true
    return resetPasswordApi(payload).finally(() => {
      loading.value = false
    })
  }

  async function logout() {
    return logoutApi().finally(() => {
      clearLocalAuth()
    })
  }

  return {
    user,
    accessToken,
    loading,
    ensureSession,
    register,
    login,
    loadMe,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    logout,
    clearLocalAuth,
  }
})
