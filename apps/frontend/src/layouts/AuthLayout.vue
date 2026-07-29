<script setup lang="ts">
import { useI18n } from "vue-i18n"
import { RouterView } from "vue-router"
import { GalleryVerticalEnd } from "@lucide/vue"
import { Button } from "@/components/ui/button"

const { t, locale } = useI18n()

function switchLocale() {
  locale.value = locale.value === "zh-CN" ? "en" : "zh-CN"
}
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <div class="relative hidden flex-col justify-between bg-muted p-10 lg:flex">
      <div class="flex items-center gap-2 text-lg font-medium">
        <div
          class="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground"
        >
          <GalleryVerticalEnd class="size-4" />
        </div>
        {{ t("nav.adminTitle") }}
      </div>
      <blockquote class="space-y-2">
        <p class="text-lg">{{ t("auth.quote") }}</p>
      </blockquote>
    </div>
    <div class="flex flex-col">
      <div class="flex justify-end p-6">
        <Button variant="outline" type="button" @click="switchLocale">
          {{ t("nav.language") }}
        </Button>
      </div>
      <div class="flex flex-1 items-center justify-center px-6 pb-16">
        <RouterView />
      </div>
    </div>
  </div>
</template>
