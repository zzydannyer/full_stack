<script setup lang="ts">
import { reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink, useRoute, useRouter } from "vue-router"
import { resetPasswordBodySchema, userFieldLimit } from "@full-stack/shared"
import { isString } from "lodash-es"
import { toast } from "vue-sonner"
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
  newPassword: "",
})
const errorMessage = ref("")

async function submit() {
  errorMessage.value = ""
  const token = route.query.token
  if (!isString(token) || token.length === 0) {
    errorMessage.value = t("auth.resetTokenMissing")
    return
  }
  const parsed = resetPasswordBodySchema.safeParse({
    token,
    newPassword: form.newPassword,
  })
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0].message
    return
  }
  await authStore.resetPassword(parsed.data).then(
    async () => {
      toast.success(t("auth.resetDone"))
      await router.push({ name: "login" })
    },
    () => undefined,
  )
}
</script>

<template>
  <section class="w-full max-w-sm">
    <Card>
      <CardHeader>
        <CardTitle>{{ t("auth.resetTitle") }}</CardTitle>
        <CardDescription>{{ t("auth.resetHint") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="newPassword">{{ t("auth.newPassword") }}</Label>
            <Input
              id="newPassword"
              v-model="form.newPassword"
              required
              type="password"
              :maxlength="userFieldLimit.passwordMax"
            />
          </div>
          <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
          <Button type="submit" :disabled="authStore.loading">{{ t("auth.resetSubmit") }}</Button>
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
