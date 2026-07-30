<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { toInteger } from "lodash-es"
import { toast } from "vue-sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  performancePresets,
  runPerformanceTests,
  type PerformanceBackend,
  type PerformanceEndpoint,
  type PerformancePreset,
  type PerformanceResult,
} from "@/lib/measure"

const { t } = useI18n()
const endpoint = ref<PerformanceEndpoint>("ping")
const preset = ref<PerformancePreset>("extreme")
const settings = ref({ ...performancePresets.extreme })
const loading = ref(false)
const results = ref<PerformanceResult[]>([])
const latencyMetrics = [
  { key: "avg", color: "bg-sky-500" },
  { key: "p50", color: "bg-violet-500" },
  { key: "p95", color: "bg-amber-500" },
] as const
const backendBarClasses: Record<PerformanceBackend, string> = {
  nest: "bg-rose-500",
  axum: "bg-orange-500",
  elysia: "bg-emerald-500",
  spring: "bg-green-600",
}
const maxLatency = computed(() =>
  Math.max(...results.value.flatMap((result) => [result.avg, result.p50, result.p95])),
)
const maxThroughput = computed(() =>
  Math.max(...results.value.map((result) => result.throughput)),
)
const validationMessages = computed(() => {
  const messages: string[] = []
  if (endpoint.value === "json" && (settings.value.size < 1 || settings.value.size > 50000)) {
    messages.push(t("performance.invalidSize"))
  }
  if (
    endpoint.value === "compute" &&
    (settings.value.iterations < 1 || settings.value.iterations > 50000000)
  ) {
    messages.push(t("performance.invalidIterations"))
  }
  if (
    endpoint.value === "databaseRead" &&
    (settings.value.limit < 1 || settings.value.limit > 10000)
  ) {
    messages.push(t("performance.invalidLimit"))
  }
  if (
    endpoint.value === "databaseWrite" &&
    (settings.value.count < 1 || settings.value.count > 1000)
  ) {
    messages.push(t("performance.invalidCount"))
  }
  if (settings.value.samples < 1 || settings.value.samples > 5000) {
    messages.push(t("performance.invalidSamples"))
  }
  if (settings.value.concurrency < 1 || settings.value.concurrency > 64) {
    messages.push(t("performance.invalidConcurrency"))
  }
  return messages
})

watch(preset, (value) => {
  settings.value = { ...performancePresets[value] }
})

function resultKey(result: PerformanceResult) {
  if (result.database === "none") return result.backend
  return `${result.backend}-${result.database}`
}

function resultLabel(result: PerformanceResult) {
  const backend = t(`performance.target.${result.backend}`)
  if (result.database === "none") return backend
  return `${backend} · ${t(`performance.database.${result.database}`)}`
}

function barWidth(value: number, maximum: number) {
  return `${(value / maximum) * 100}%`
}

function rangeLabel(label: string, minimum: number, maximum: number) {
  return t("performance.labelWithRange", { label, minimum, maximum })
}

async function runTests() {
  if (validationMessages.value.length > 0) {
    toast.error(validationMessages.value.join(" / "))
    return
  }
  loading.value = true
  results.value = []
  results.value = await runPerformanceTests({
    ...settings.value,
    endpoint: endpoint.value,
  })
  loading.value = false
}
</script>

<template>
  <section class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">{{ t("performance.title") }}</h1>
      <p class="text-muted-foreground">{{ t("performance.description") }}</p>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>{{ t("performance.options") }}</CardTitle>
        <CardDescription>{{ t("performance.measureHint") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:items-end" @submit.prevent="runTests">
          <div class="grid gap-2">
            <Label for="performance-endpoint">{{ t("performance.endpoint") }}</Label>
            <Select v-model="endpoint">
              <SelectTrigger id="performance-endpoint" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ping">{{ t("performance.ping") }}</SelectItem>
                <SelectItem value="json">{{ t("performance.json") }}</SelectItem>
                <SelectItem value="compute">{{ t("performance.compute") }}</SelectItem>
                <SelectItem value="databaseRead">{{ t("performance.databaseRead") }}</SelectItem>
                <SelectItem value="databaseWrite">{{ t("performance.databaseWrite") }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid gap-2">
            <Label for="performance-preset">{{ t("performance.preset") }}</Label>
            <Select v-model="preset">
              <SelectTrigger id="performance-preset" class="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{{ t("performance.light") }}</SelectItem>
                <SelectItem value="heavy">{{ t("performance.heavy") }}</SelectItem>
                <SelectItem value="extreme">{{ t("performance.extreme") }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="endpoint === 'json'" class="grid gap-2">
            <Label for="performance-size">
              {{ rangeLabel(t("performance.size"), 1, 50000) }}
            </Label>
            <Input
              id="performance-size"
              :model-value="settings.size"
              type="number"
              min="1"
              max="50000"
              @update:model-value="settings.size = toInteger($event)"
            />
          </div>
          <div v-if="endpoint === 'compute'" class="grid gap-2">
            <Label for="performance-iterations">
              {{ rangeLabel(t("performance.iterations"), 1, 50000000) }}
            </Label>
            <Input
              id="performance-iterations"
              :model-value="settings.iterations"
              type="number"
              min="1"
              max="50000000"
              @update:model-value="settings.iterations = toInteger($event)"
            />
          </div>
          <div v-if="endpoint === 'databaseRead'" class="grid gap-2">
            <Label for="performance-limit">
              {{ rangeLabel(t("performance.limit"), 1, 10000) }}
            </Label>
            <Input
              id="performance-limit"
              :model-value="settings.limit"
              type="number"
              min="1"
              max="10000"
              @update:model-value="settings.limit = toInteger($event)"
            />
          </div>
          <div v-if="endpoint === 'databaseWrite'" class="grid gap-2">
            <Label for="performance-count">
              {{ rangeLabel(t("performance.count"), 1, 1000) }}
            </Label>
            <Input
              id="performance-count"
              :model-value="settings.count"
              type="number"
              min="1"
              max="1000"
              @update:model-value="settings.count = toInteger($event)"
            />
          </div>
          <div class="grid gap-2">
            <Label for="performance-samples">
              {{ rangeLabel(t("performance.samples"), 1, 5000) }}
            </Label>
            <Input
              id="performance-samples"
              :model-value="settings.samples"
              type="number"
              min="1"
              max="5000"
              @update:model-value="settings.samples = toInteger($event)"
            />
          </div>
          <div class="grid gap-2">
            <Label for="performance-concurrency">
              {{ rangeLabel(t("performance.concurrency"), 1, 64) }}
            </Label>
            <Input
              id="performance-concurrency"
              :model-value="settings.concurrency"
              type="number"
              min="1"
              max="64"
              @update:model-value="settings.concurrency = toInteger($event)"
            />
          </div>
          <Button type="submit" :disabled="loading">
            {{ loading ? t("performance.running") : t("performance.run") }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <div v-if="results.length > 0" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card
        v-for="result in results"
        :key="resultKey(result)"
        :data-testid="`performance-result-${resultKey(result)}`"
      >
        <CardHeader>
          <CardTitle>{{ t(`performance.target.${result.backend}`) }}</CardTitle>
          <CardDescription v-if="result.database !== 'none'">
            {{ t(`performance.database.${result.database}`) }}
          </CardDescription>
          <CardDescription>{{ t(`performance.${endpoint}`) }}</CardDescription>
        </CardHeader>
        <CardContent class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-muted-foreground">{{ t("performance.avg") }}</p>
            <p class="text-lg font-semibold">{{ result.avg.toFixed(2) }} ms</p>
          </div>
          <div>
            <p class="text-muted-foreground">{{ t("performance.p50") }}</p>
            <p class="text-lg font-semibold">{{ result.p50.toFixed(2) }} ms</p>
          </div>
          <div>
            <p class="text-muted-foreground">{{ t("performance.p95") }}</p>
            <p class="text-lg font-semibold">{{ result.p95.toFixed(2) }} ms</p>
          </div>
          <div>
            <p class="text-muted-foreground">{{ t("performance.throughput") }}</p>
            <p class="text-lg font-semibold">
              {{ result.throughput.toFixed(2) }} {{ t("performance.perSecond") }}
            </p>
          </div>
          <div>
            <p class="text-muted-foreground">{{ t("performance.successful") }}</p>
            <p class="text-lg font-semibold">
              {{ result.successful }} ({{ result.successRate.toFixed(1) }}%)
            </p>
          </div>
          <div>
            <p class="text-muted-foreground">{{ t("performance.failed") }}</p>
            <p class="text-lg font-semibold">{{ result.failed }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="results.length > 0" class="grid gap-4 xl:grid-cols-3">
      <Card data-testid="performance-chart-latency">
        <CardHeader>
          <CardTitle>{{ t("performance.latencyChart") }}</CardTitle>
          <CardDescription>{{ t("performance.latencyHint") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div v-for="result in results" :key="`latency-${resultKey(result)}`" class="space-y-2">
            <p class="truncate text-sm font-medium">{{ resultLabel(result) }}</p>
            <div v-for="metric in latencyMetrics" :key="metric.key" class="grid gap-1">
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="text-muted-foreground">{{ t(`performance.${metric.key}`) }}</span>
                <span class="font-medium">{{ result[metric.key].toFixed(2) }} ms</span>
              </div>
              <div class="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  class="h-full rounded-full transition-[width]"
                  :class="metric.color"
                  :style="{ width: barWidth(result[metric.key], maxLatency) }"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="performance-chart-throughput">
        <CardHeader>
          <CardTitle>{{ t("performance.throughputChart") }}</CardTitle>
          <CardDescription>{{ t("performance.throughputHint") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div v-for="result in results" :key="`throughput-${resultKey(result)}`" class="space-y-2">
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="truncate font-medium">{{ resultLabel(result) }}</span>
              <span class="shrink-0">
                {{ result.throughput.toFixed(2) }} {{ t("performance.perSecond") }}
              </span>
            </div>
            <div class="bg-muted h-3 overflow-hidden rounded-full">
              <div
                class="h-full rounded-full transition-[width]"
                :class="backendBarClasses[result.backend]"
                :style="{ width: barWidth(result.throughput, maxThroughput) }"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="performance-chart-success">
        <CardHeader>
          <CardTitle>{{ t("performance.successChart") }}</CardTitle>
          <CardDescription>{{ t("performance.successHint") }}</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div v-for="result in results" :key="`success-${resultKey(result)}`" class="space-y-2">
            <div class="flex items-center justify-between gap-3 text-sm">
              <span class="truncate font-medium">{{ resultLabel(result) }}</span>
              <span class="shrink-0">{{ result.successRate.toFixed(1) }}%</span>
            </div>
            <div class="bg-muted h-3 overflow-hidden rounded-full">
              <div
                class="h-full rounded-full transition-[width]"
                :class="backendBarClasses[result.backend]"
                :style="{ width: `${result.successRate}%` }"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
</template>
