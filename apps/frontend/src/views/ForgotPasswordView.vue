<script setup lang="ts">
import { reactive, ref } from "vue"
import { useI18n } from "vue-i18n"
import { RouterLink } from "vue-router"
import { forgotPasswordBodySchema } from "@full-stack/shared"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/stores/auth"

const { t } = useI18n()
const authStore = useAuthStore()
const form = reactive({
  email: "",
})
const errorMessage = ref("")

async function submit() {
  errorMessage.value = ""
  const parsed = forgotPasswordBodySchema.safeParse(form)
  if (!parsed.success) {
    errorMessage.value = parsed.error.issues[0].message
    return
  }
  await authStore.forgotPassword(parsed.data).then(
    () => {
      toast.success(t("auth.forgotSent"))
    },
    () => undefined,
  )
}
</script>

<template>
  <section class="w-full max-w-sm">
    <Card>
      <CardHeader>
        <CardTitle>{{ t("auth.forgotTitle") }}</CardTitle>
        <CardDescription>{{ t("auth.forgotHint") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4" @submit.prevent="submit">
          <div class="grid gap-2">
            <Label for="email">{{ t("auth.email") }}</Label>
            <Input id="email" v-model="form.email" required type="email" />
          </div>
          <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
          <Button type="submit" :disabled="authStore.loading">{{ t("auth.forgotSubmit") }}</Button>
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
