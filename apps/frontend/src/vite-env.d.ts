/// <reference types="vite/client" />

import type { Role } from "@full-stack/shared"

export {}

declare global {
  interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
  }
}

declare module "vue-router" {
  interface RouteMeta {
    auth?: boolean
    guest?: boolean
    roles?: Role[]
  }
}
