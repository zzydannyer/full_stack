<script setup lang="ts">
import { reactive, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import {
  changePasswordBodySchema,
  updateProfileBodySchema,
  userFieldLimit,
} from "@full-stack/shared"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth"

const { t } = useI18n()
const authStore = useAuthStore()
const profileError = ref("")
const passwordError = ref("")
const profileForm = reactive({
  name: "",
  email: "",
})
const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
})

watch(
  () => authStore.user,
  (user) => {
    if (!user) return
    profileForm.name = user.name
    profileForm.email = user.email
  },
  { immediate: true },
)

async function submitProfile() {
  profileError.value = ""
  const parsed = updateProfileBodySchema.safeParse(profileForm)
  if (!parsed.success) {
    profileError.value = parsed.error.issues[0].message
    return
  }
  await authStore.updateProfile(parsed.data).then(
    () => {
      toast.success(t("settings.profileSaved"))
    },
    () => undefined,
  )
}

async function submitPassword() {
  passwordError.value = ""
  const parsed = changePasswordBodySchema.safeParse(passwordForm)
  if (!parsed.success) {
    passwordError.value = parsed.error.issues[0].message
    return
  }
  await authStore.changePassword(parsed.data).then(
    () => {
      passwordForm.oldPassword = ""
      passwordForm.newPassword = ""
      toast.success(t("settings.passwordSaved"))
    },
    () => undefined,
  )
}
</script>

<template>
  <section class="mx-auto grid w-full max-w-2xl gap-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">{{ t("settings.title") }}</h1>
      <p class="text-muted-foreground">{{ t("settings.description") }}</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("settings.profileTitle") }}</CardTitle>
        <CardDescription>{{ t("settings.profileHint") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submitProfile">
          <div class="grid gap-2">
            <Label for="profile-name">{{ t("auth.name") }}</Label>
            <Input
              id="profile-name"
              v-model="profileForm.name"
              required
              type="text"
              :maxlength="userFieldLimit.nameMax"
            />
          </div>
          <div class="grid gap-2">
            <Label for="profile-email">{{ t("auth.email") }}</Label>
            <Input id="profile-email" v-model="profileForm.email" required type="email" />
          </div>
          <p v-if="profileError" class="text-sm text-destructive">{{ profileError }}</p>
          <Button type="submit" class="w-fit" :disabled="authStore.loading">
            {{ t("settings.saveProfile") }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("settings.passwordTitle") }}</CardTitle>
        <CardDescription>{{ t("settings.passwordHint") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submitPassword">
          <div class="grid gap-2">
            <Label for="old-password">{{ t("settings.oldPassword") }}</Label>
            <Input
              id="old-password"
              v-model="passwordForm.oldPassword"
              required
              type="password"
              :maxlength="userFieldLimit.passwordMax"
            />
          </div>
          <div class="grid gap-2">
            <Label for="new-password">{{ t("settings.newPassword") }}</Label>
            <Input
              id="new-password"
              v-model="passwordForm.newPassword"
              required
              type="password"
              :maxlength="userFieldLimit.passwordMax"
            />
          </div>
          <p v-if="passwordError" class="text-sm text-destructive">{{ passwordError }}</p>
          <Button type="submit" class="w-fit" :disabled="authStore.loading">
            {{ t("settings.savePassword") }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </section>
</template>
