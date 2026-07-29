import axios, { isAxiosError } from "axios"
import type { AxiosError, InternalAxiosRequestConfig } from "axios"
import type { AuthRefresh } from "@full-stack/shared"
import { getErrorCodeMessageKey } from "@full-stack/shared"
import { isNumber, isObject, isString } from "lodash-es"
import { toast } from "vue-sonner"
import { i18n } from "@/i18n"

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
})

const retriedConfigs = new WeakSet<InternalAxiosRequestConfig>()
let accessTokenMemory = ""
let refreshing = false
let refreshRequest = Promise.resolve("")

function readErrorMessage(error: AxiosError) {
  if (isObject(error.response) && isObject(error.response.data)) {
    const data = error.response.data
    if ("code" in data && isNumber(data.code)) {
      const key = getErrorCodeMessageKey(data.code)
      if (isString(key)) return i18n.global.t(key)
    }
    if ("message" in data && isString(data.message)) return data.message
  }
  return i18n.global.t("http.requestFailed")
}

export function writeAccessToken(token: string) {
  accessTokenMemory = token
}

export function readAccessToken() {
  return accessTokenMemory
}

function clearSessionAndRedirect(error: AxiosError) {
  writeAccessToken("")
  return import("@/stores/auth").then(({ useAuthStore }) => {
    useAuthStore().clearLocalAuth()
    return import("@/router").then(({ router }) => {
      if (router.currentRoute.value.name === "login") return Promise.reject(error)
      return router
        .push({ name: "login", query: { redirect: router.currentRoute.value.fullPath } })
        .then(() => Promise.reject(error))
    })
  })
}

function refreshAccessToken() {
  if (refreshing) return refreshRequest
  refreshing = true
  refreshRequest = http
    .post<AuthRefresh>("/auth/refresh")
    .then((response) => {
      writeAccessToken(response.data.token.accessToken)
      return response.data.token.accessToken
    })
    .finally(() => {
      refreshing = false
    })
  return refreshRequest
}

http.interceptors.request.use((config) => {
  const token = readAccessToken()
  if (token.length > 0) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    if (isObject(response.data) && "data" in response.data) {
      response.data = response.data.data
    }
    return response
  },
  (error) => {
    if (!isAxiosError(error)) {
      toast.error(i18n.global.t("http.requestFailed"))
      return Promise.reject(error)
    }

    const config = error.config
    const status = error.response?.status
    const url = config?.url ?? ""
    const canRefresh =
      status === 401 &&
      config &&
      !retriedConfigs.has(config) &&
      !url.includes("/auth/refresh") &&
      !url.includes("/auth/login") &&
      !url.includes("/auth/register")

    if (canRefresh) {
      return refreshAccessToken().then(
        (token) => {
          retriedConfigs.add(config)
          config.headers.Authorization = `Bearer ${token}`
          return http.request(config)
        },
        (refreshError) => {
          toast.error(readErrorMessage(isAxiosError(refreshError) ? refreshError : error))
          return clearSessionAndRedirect(error)
        },
      )
    }

    if (status === 401 && url.includes("/auth/refresh")) {
      return Promise.reject(error)
    }

    toast.error(readErrorMessage(error))
    if (status === 401) return clearSessionAndRedirect(error)
    return Promise.reject(error)
  },
)
