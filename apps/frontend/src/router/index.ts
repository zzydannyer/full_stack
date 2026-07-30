import { createRouter, createWebHistory } from "vue-router"
import { isArray } from "lodash-es"
import AdminLayout from "@/layouts/AdminLayout.vue"
import AuthLayout from "@/layouts/AuthLayout.vue"
import { useAuthStore } from "@/stores/auth"
import ForgotPasswordView from "@/views/ForgotPasswordView.vue"
import HomeView from "@/views/HomeView.vue"
import LoginView from "@/views/LoginView.vue"
import PerformanceView from "@/views/PerformanceView.vue"
import RegisterView from "@/views/RegisterView.vue"
import ResetPasswordView from "@/views/ResetPasswordView.vue"
import SettingsView from "@/views/SettingsView.vue"
import UsersView from "@/views/UsersView.vue"

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      component: AuthLayout,
      meta: { guest: true },
      children: [{ path: "", name: "login", component: LoginView }],
    },
    {
      path: "/register",
      component: AuthLayout,
      meta: { guest: true },
      children: [{ path: "", name: "register", component: RegisterView }],
    },
    {
      path: "/forgot-password",
      component: AuthLayout,
      meta: { guest: true },
      children: [{ path: "", name: "forgot-password", component: ForgotPasswordView }],
    },
    {
      path: "/reset-password",
      component: AuthLayout,
      meta: { guest: true },
      children: [{ path: "", name: "reset-password", component: ResetPasswordView }],
    },
    {
      path: "/",
      component: AdminLayout,
      meta: { auth: true },
      children: [
        { path: "", name: "home", component: HomeView },
        {
          path: "users",
          name: "users",
          component: UsersView,
          meta: { roles: ["admin"] },
        },
        {
          path: "performance",
          name: "performance",
          component: PerformanceView,
          meta: { roles: ["admin"] },
        },
        { path: "settings", name: "settings", component: SettingsView },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  await authStore.ensureSession()
  const authed = authStore.accessToken.length > 0

  if (authed && !authStore.user) {
    await authStore.loadMe().then(
      () => undefined,
      () => {
        authStore.clearLocalAuth()
      },
    )
  }

  if (to.matched.some((record) => record.meta.auth) && !authed) {
    return { name: "login", query: { redirect: to.fullPath } }
  }

  if (to.matched.some((record) => record.meta.guest) && authed) {
    return { name: "home" }
  }

  const roles = to.matched.flatMap((record) => {
    if (!isArray(record.meta.roles)) return []
    return record.meta.roles
  })
  if (roles.length === 0) return
  if (!authStore.user) return { name: "login" }
  if (!roles.includes(authStore.user.role)) return { name: "home" }
})
