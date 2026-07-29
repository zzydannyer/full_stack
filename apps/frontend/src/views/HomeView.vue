<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { useAuthStore } from "@/stores/auth"

const { t } = useI18n()
const authStore = useAuthStore()
</script>

<template>
  <section class="space-y-2">
    <h1 class="text-2xl font-semibold tracking-tight">{{ t("home.title") }}</h1>
    <p class="text-muted-foreground">{{ t("home.description") }}</p>
    <p v-if="authStore.user" class="pt-4 text-sm">
      {{ t("home.welcome", { name: authStore.user.name }) }}
    </p>
  </section>
</template>
