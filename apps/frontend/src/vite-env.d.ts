/// <reference types="vite/client" />

import type { Role } from "@full-stack/shared"

export {}

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
    readonly VITE_BACKEND_NEST_URL: string
    readonly VITE_BACKEND_AXUM_URL: string
    readonly VITE_BACKEND_ELYSIA_URL: string
    readonly VITE_BACKEND_SPRING_URL: string
  }
}

declare module "vue-router" {
  interface RouteMeta {
    auth?: boolean
    guest?: boolean
    roles?: Role[]
  }
}
