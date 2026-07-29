<script setup lang="ts">
import { computed } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router"
import { useDark, useToggle } from "@vueuse/core"
import { roles, type Role } from "@full-stack/shared"
import {
  ChevronsUpDown,
  GalleryVerticalEnd,
  Home,
  LogOut,
  Moon,
  Settings,
  Sun,
  Users,
} from "@lucide/vue"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/stores/auth"

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isDark = useDark({
  selector: "html",
  attribute: "class",
  valueDark: "dark",
  valueLight: "",
})
const toggleDark = useToggle(isDark)

const avatarText = computed(() => {
  if (!authStore.user) return ""
  return authStore.user.name.slice(0, 1)
})

const menuItems = computed(() => {
  const allRoles: Role[] = [...roles]
  const adminRoles: Role[] = ["admin"]
  const items = [
    { title: t("nav.home"), to: "/", icon: Home, roles: allRoles },
    { title: t("nav.users"), to: "/users", icon: Users, roles: adminRoles },
    { title: t("nav.settings"), to: "/settings", icon: Settings, roles: allRoles },
  ]
  const current = authStore.user
  if (!current) return items.filter((item) => item.to === "/")
  return items.filter((item) => item.roles.includes(current.role))
})

function switchLocale() {
  locale.value = locale.value === "zh-CN" ? "en" : "zh-CN"
}

async function logout() {
  await authStore.logout()
  await router.push({ name: "login" })
}
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child>
              <RouterLink to="/">
                <div
                  class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
                >
                  <GalleryVerticalEnd class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ t("nav.adminTitle") }}</span>
                  <span class="truncate text-xs">Full Stack</span>
                </div>
              </RouterLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{{ t("nav.menu") }}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in menuItems" :key="item.to">
                <SidebarMenuButton
                  as-child
                  :is-active="route.path === item.to"
                  :tooltip="item.title"
                >
                  <RouterLink :to="item.to">
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
                  </RouterLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar class="size-8 rounded-lg">
                    <AvatarFallback class="rounded-lg">{{ avatarText }}</AvatarFallback>
                  </Avatar>
                  <div v-if="authStore.user" class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-medium">{{ authStore.user.name }}</span>
                    <span class="truncate text-xs">{{ authStore.user.email }}</span>
                  </div>
                  <ChevronsUpDown class="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                :side-offset="4"
              >
                <DropdownMenuLabel class="p-0 font-normal">
                  <div
                    v-if="authStore.user"
                    class="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                  >
                    <Avatar class="size-8 rounded-lg">
                      <AvatarFallback class="rounded-lg">{{ avatarText }}</AvatarFallback>
                    </Avatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-medium">{{ authStore.user.name }}</span>
                      <span class="truncate text-xs">{{ authStore.user.username }}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem as-child>
                  <RouterLink to="/settings">{{ t("nav.settings") }}</RouterLink>
                </DropdownMenuItem>
                <DropdownMenuItem @click="logout">
                  <LogOut />
                  {{ t("nav.logout") }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <div class="mr-2 h-4 w-px bg-border" />
        <div class="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" type="button" @click="switchLocale">
            {{ t("nav.language") }}
          </Button>
          <Button variant="outline" size="icon" type="button" @click="toggleDark()">
            <Sun v-if="isDark" class="size-4" />
            <Moon v-else class="size-4" />
          </Button>
        </div>
      </header>
      <main class="flex flex-1 flex-col gap-4 p-4 md:p-6">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
