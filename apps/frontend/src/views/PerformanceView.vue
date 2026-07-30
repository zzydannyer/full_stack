<script setup lang="ts">
import { computed, ref, watch } from "vue"
import { useI18n } from "vue-i18n"
import { isArray, isNumber, isObject, isString, toInteger } from "lodash-es"
import { toast } from "vue-sonner"
import { use } from "echarts/core"
import { BarChart } from "echarts/charts"
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components"
import { CanvasRenderer } from "echarts/renderers"
import type { CallbackDataParams } from "echarts/types/dist/shared"
import VChart from "vue-echarts"
import "vue-echarts/style.css"
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
  createPerformanceControl,
  performancePresets,
  runPerformanceTests,
  type PerformanceBackend,
  type PerformanceControl,
  type PerformanceEndpoint,
  type PerformancePreset,
  type PerformanceResult,
} from "@/lib/measure"

use([CanvasRenderer, BarChart, GridComponent, TooltipComponent, LegendComponent])

const { t } = useI18n()
const endpoint = ref<PerformanceEndpoint>("ping")
const preset = ref<PerformancePreset>("extreme")
const settings = ref({ ...performancePresets.extreme })
const runState = ref<"idle" | "running" | "paused">("idle")
const control = ref<PerformanceControl>(createPerformanceControl())
const runSession = ref(0)
const results = ref<PerformanceResult[]>([])
const comparisonMetrics = [
  { key: "avg", invert: true },
  { key: "p50", invert: true },
  { key: "p95", invert: true },
  { key: "throughput", invert: false },
  { key: "successRate", invert: false },
] as const
const backendColors: Record<PerformanceBackend, string> = {
  nest: "#e11d48",
  axum: "#f97316",
  elysia: "#10b981",
  spring: "#16a34a",
}

const chartOption = computed(() => {
  const categories = comparisonMetrics.map((metric) => t(`performance.${metric.key}`))
  return {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: formatChartTooltip,
    },
    legend: {
      top: 0,
      data: results.value.map((result) => resultLabel(result)),
    },
    grid: {
      left: 16,
      right: 16,
      top: 56,
      bottom: 8,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: {
        interval: 0,
      },
    },
    yAxis: {
      type: "value",
      name: t("performance.normalizedAxis"),
      max: 100,
      splitLine: { lineStyle: { type: "dashed" } },
    },
    series: results.value.map((result) => ({
      name: resultLabel(result),
      type: "bar",
      barMaxWidth: 36,
      itemStyle: {
        color: backendColors[result.backend],
        opacity: result.database === "mysql" ? 0.65 : 1,
      },
      data: comparisonMetrics.map((metric) => {
        const values = results.value.map((item) => item[metric.key])
        const peak = Math.max(...values, 1)
        const floor = Math.min(...values, peak)
        const value = result[metric.key]
        return {
          value: metric.invert ? (floor / Math.max(value, floor)) * 100 : (value / peak) * 100,
          raw: value,
          metricKey: metric.key,
        }
      }),
    })),
  }
})

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

function rangeLabel(label: string, minimum: number, maximum: number) {
  return t("performance.labelWithRange", { label, minimum, maximum })
}

function formatMetricRaw(metricKey: string, raw: number) {
  if (metricKey === "throughput") {
    return `${raw.toFixed(2)} ${t("performance.perSecond")}`
  }
  if (metricKey === "successRate") return `${raw.toFixed(1)}%`
  return `${raw.toFixed(2)} ms`
}

function formatChartTooltip(params: CallbackDataParams | CallbackDataParams[]) {
  if (!isArray(params)) return ""
  const title = params[0]?.axisValueLabel ?? ""
  const lines = params.map((item) => {
    const data = item.data
    if (!isObject(data) || !("raw" in data) || !("metricKey" in data)) return ""
    if (!isNumber(data.raw) || !isString(data.metricKey)) return ""
    return `${item.marker}${item.seriesName}: ${formatMetricRaw(data.metricKey, data.raw)}`
  })
  return [title, ...lines.filter((line) => line.length > 0)].join("<br/>")
}

async function runTests() {
  if (runState.value !== "idle") return
  if (validationMessages.value.length > 0) {
    toast.error(validationMessages.value.join(" / "))
    return
  }
  const nextControl = createPerformanceControl()
  const session = runSession.value + 1
  control.value = nextControl
  runSession.value = session
  runState.value = "running"
  results.value = []
  await runPerformanceTests(
    {
      ...settings.value,
      endpoint: endpoint.value,
    },
    nextControl,
    (result) => {
      if (runSession.value !== session) return
      results.value = [...results.value, result]
    },
  ).then(
    () => undefined,
    () => undefined,
  )
  if (runSession.value === session) runState.value = "idle"
}

function pauseTests() {
  control.value.pause()
  runState.value = "paused"
}

function resumeTests() {
  control.value.resume()
  runState.value = "running"
}

function cancelTests() {
  runSession.value += 1
  control.value.cancel()
  runState.value = "idle"
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
        <form
          class="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:items-end"
          @submit.prevent="runTests"
        >
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
          <div class="flex flex-wrap items-center gap-2">
            <Button type="submit" class="h-9" :disabled="runState !== 'idle'">
              {{ runState === "idle" ? t("performance.run") : t("performance.running") }}
            </Button>
            <Button
              v-if="runState === 'running'"
              type="button"
              class="h-9"
              variant="secondary"
              @click="pauseTests"
            >
              {{ t("performance.pause") }}
            </Button>
            <Button
              v-if="runState === 'paused'"
              type="button"
              class="h-9"
              variant="secondary"
              @click="resumeTests"
            >
              {{ t("performance.resume") }}
            </Button>
            <Button
              v-if="runState !== 'idle'"
              type="button"
              class="h-9"
              variant="outline"
              @click="cancelTests"
            >
              {{ t("performance.cancel") }}
            </Button>
          </div>
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

    <Card v-if="results.length > 0" data-testid="performance-chart">
      <CardHeader>
        <CardTitle>{{ t("performance.comparisonChart") }}</CardTitle>
        <CardDescription>{{ t("performance.comparisonHint") }}</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="h-[420px] w-full">
          <VChart class="h-full w-full" :option="chartOption" :autoresize="true" />
        </div>
      </CardContent>
    </Card>
  </section>
</template>
