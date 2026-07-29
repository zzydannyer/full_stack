<script setup lang="ts">
import { reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, useRouter } from "vue-router"
import { registerBodySchema, userFieldLimit } from "@full-stack/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth"

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const form = reactive({
  email: "",
  name: "",
  password: "",
})
const errorMessage = ref("")

async function submit() {
  errorMessage.value = ""
  const parsed = registerBodySchema.safeParse(form)
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0].message
    return
  }
  await authStore.register(parsed.data).then(
    async () => {
      await router.push({ name: "home" })
    },
    () => undefined,
  )
}
</script>

<template>
  <section class="w-full max-w-sm">
    <Card>
      <CardHeader>
        <CardTitle>{{ t("auth.registerTitle") }}</CardTitle>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="name">{{ t("auth.name") }}</Label>
            <Input
              id="name"
              v-model="form.name"
              required
              type="text"
              :maxlength="userFieldLimit.nameMax"
              :placeholder="t('auth.name')"
            />
          </div>
          <div class="grid gap-2">
            <Label for="email">{{ t("auth.email") }}</Label>
            <Input
              id="email"
              v-model="form.email"
              required
              type="email"
              :placeholder="t('auth.email')"
            />
          </div>
          <div class="grid gap-2">
            <Label for="password">{{ t("auth.password") }}</Label>
            <Input
              id="password"
              v-model="form.password"
              required
              type="password"
              :maxlength="userFieldLimit.passwordMax"
              :placeholder="t('auth.password')"
            />
          </div>
          <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
          <Button type="submit" :disabled="authStore.loading">{{ t("auth.register") }}</Button>
          <p class="text-center text-sm text-muted-foreground">
            <RouterLink class="underline-offset-4 hover:underline" to="/login">
              {{ t("auth.toLogin") }}
            </RouterLink>
          </p>
        </form>
      </CardContent>
    </Card>
  </section>
</template>
