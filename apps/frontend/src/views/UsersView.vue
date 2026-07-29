<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import type { Role, User } from "@full-stack/shared"
import {
  createUserBodySchema,
  roles,
  updateUserBodySchema,
  userFieldLimit,
} from "@full-stack/shared"
import { toast } from "vue-sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useUserStore } from "@/stores/user"

const { t } = useI18n()
const userStore = useUserStore()
const dialogOpen = ref(false)
const editing = ref<User>()
const formError = ref("")
const form = reactive({
  username: "",
  email: "",
  name: "",
  password: "",
  role: "user" as Role,
  disabled: false,
})

const totalPages = computed(() => {
  if (userStore.pageSize === 0) return 1
  const pages = Math.ceil(userStore.total / userStore.pageSize)
  if (pages < 1) return 1
  return pages
})

onMounted(() => {
  userStore.loadUsers({ page: 1, pageSize: 20 })
})

function openCreate() {
  editing.value = undefined
  form.username = ""
  form.email = ""
  form.name = ""
  form.password = ""
  form.role = "user"
  form.disabled = false
  formError.value = ""
  dialogOpen.value = true
}

function openEdit(user: User) {
  editing.value = user
  form.username = user.username
  form.email = user.email
  form.name = user.name
  form.password = ""
  form.role = user.role
  form.disabled = user.disabled
  formError.value = ""
  dialogOpen.value = true
}

async function submitForm() {
  formError.value = ""
  if (editing.value) {
    const parsed = updateUserBodySchema.safeParse({
      username: form.username,
      email: form.email,
      name: form.name,
      role: form.role,
      disabled: form.disabled,
    })
    if (!parsed.success) {
      formError.value = parsed.error.issues[0].message
      return
    }
    const ok = await userStore.updateUser(editing.value.id, parsed.data)
    if (!ok) return
    toast.success(t("users.saved"))
    dialogOpen.value = false
    return
  }

  const parsed = createUserBodySchema.safeParse(form)
  if (!parsed.success) {
    formError.value = parsed.error.issues[0].message
    return
  }
  const ok = await userStore.createUser(parsed.data)
  if (!ok) return
  toast.success(t("users.saved"))
  dialogOpen.value = false
}

async function removeUser(user: User) {
  const ok = await userStore.removeUser(user.id)
  if (!ok) return
  toast.success(t("users.deleted"))
}

async function goPage(next: number) {
  if (next < 1 || next > totalPages.value) return
  await userStore.loadUsers({ page: next, pageSize: userStore.pageSize })
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">{{ t("users.title") }}</h1>
        <p class="text-muted-foreground">{{ t("users.description") }}</p>
      </div>
      <Button type="button" @click="openCreate">{{ t("users.create") }}</Button>
    </div>

    <div class="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t("auth.name") }}</TableHead>
            <TableHead>{{ t("auth.account") }}</TableHead>
            <TableHead>{{ t("auth.email") }}</TableHead>
            <TableHead>{{ t("users.role") }}</TableHead>
            <TableHead>{{ t("users.status") }}</TableHead>
            <TableHead class="text-right">{{ t("users.actions") }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="userStore.loading">
            <TableCell colspan="6" class="text-muted-foreground">{{
              t("users.loading")
            }}</TableCell>
          </TableRow>
          <TableRow v-else-if="userStore.users.length === 0">
            <TableCell colspan="6" class="text-muted-foreground">{{ t("users.empty") }}</TableCell>
          </TableRow>
          <TableRow v-for="user in userStore.users" :key="user.id">
            <TableCell>{{ user.name }}</TableCell>
            <TableCell>{{ user.username }}</TableCell>
            <TableCell>{{ user.email }}</TableCell>
            <TableCell>
              <Badge variant="secondary">{{ t(`role.${user.role}`) }}</Badge>
            </TableCell>
            <TableCell>
              <Badge :variant="user.disabled ? 'destructive' : 'secondary'">
                {{ user.disabled ? t("users.disabled") : t("users.enabled") }}
              </Badge>
            </TableCell>
            <TableCell class="space-x-2 text-right">
              <Button variant="ghost" size="sm" type="button" @click="openEdit(user)">
                {{ t("users.edit") }}
              </Button>
              <Button variant="ghost" size="sm" type="button" @click="removeUser(user)">
                {{ t("users.delete") }}
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <div class="flex items-center justify-end gap-2">
      <span class="text-sm text-muted-foreground"> {{ userStore.page }} / {{ totalPages }} </span>
      <Button
        variant="outline"
        size="sm"
        type="button"
        :disabled="userStore.page <= 1"
        @click="goPage(userStore.page - 1)"
      >
        {{ t("users.prev") }}
      </Button>
      <Button
        variant="outline"
        size="sm"
        type="button"
        :disabled="userStore.page >= totalPages"
        @click="goPage(userStore.page + 1)"
      >
        {{ t("users.next") }}
      </Button>
    </div>

    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {{ editing ? t("users.editTitle") : t("users.createTitle") }}
          </DialogTitle>
        </DialogHeader>
        <form class="grid gap-4" @submit.prevent="submitForm">
          <div class="grid gap-2">
            <Label for="user-name">{{ t("auth.name") }}</Label>
            <Input
              id="user-name"
              v-model="form.name"
              required
              type="text"
              :maxlength="userFieldLimit.nameMax"
            />
          </div>
          <div class="grid gap-2">
            <Label for="user-username">{{ t("auth.account") }}</Label>
            <Input
              id="user-username"
              v-model="form.username"
              required
              type="text"
              :maxlength="userFieldLimit.usernameMax"
            />
          </div>
          <div class="grid gap-2">
            <Label for="user-email">{{ t("auth.email") }}</Label>
            <Input id="user-email" v-model="form.email" required type="email" />
          </div>
          <div v-if="!editing" class="grid gap-2">
            <Label for="user-password">{{ t("auth.password") }}</Label>
            <Input
              id="user-password"
              v-model="form.password"
              required
              type="password"
              :maxlength="userFieldLimit.passwordMax"
            />
          </div>
          <div class="grid gap-2">
            <Label>{{ t("users.role") }}</Label>
            <Select v-model="form.role">
              <SelectTrigger class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="role in roles" :key="role" :value="role">
                  {{ t(`role.${role}`) }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <label v-if="editing" class="flex items-center gap-2 text-sm">
            <input v-model="form.disabled" type="checkbox" class="size-4" />
            {{ t("users.disabled") }}
          </label>
          <p v-if="formError" class="text-sm text-destructive">{{ formError }}</p>
          <DialogFooter>
            <Button type="submit" :disabled="userStore.loading">{{ t("users.save") }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </section>
</template>
