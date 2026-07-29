<script setup lang="ts">
import { reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { loginBodySchema, userFieldLimit } from "@full-stack/shared"
import { isString } from "lodash-es"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth"

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const form = reactive({
  account: "",
  password: "",
})
const errorMessage = ref("")

async function submit() {
  errorMessage.value = ""
  const parsed = loginBodySchema.safeParse(form)
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0].message
    return
  }
  await authStore.login(parsed.data).then(
    async () => {
      const redirect = route.query.redirect
      if (isString(redirect) && redirect.length > 0) {
        await router.push(redirect)
        return
      }
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
        <CardTitle>{{ t("auth.loginTitle") }}</CardTitle>
        <CardDescription>{{ t("auth.loginHint") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="account">{{ t("auth.account") }}</Label>
            <Input
              id="account"
              v-model="form.account"
              required
              type="text"
              :maxlength="userFieldLimit.accountMax"
              :placeholder="t('auth.account')"
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
          <Button type="submit" :disabled="authStore.loading">{{ t("auth.login") }}</Button>
          <p class="text-center text-sm text-muted-foreground">
            <RouterLink class="underline-offset-4 hover:underline" to="/forgot-password">
              {{ t("auth.toForgot") }}
            </RouterLink>
          </p>
          <p class="text-center text-sm text-muted-foreground">
            <RouterLink class="underline-offset-4 hover:underline" to="/register">
              {{ t("auth.toRegister") }}
            </RouterLink>
          </p>
        </form>
      </CardContent>
    </Card>
  </section>
</template>
