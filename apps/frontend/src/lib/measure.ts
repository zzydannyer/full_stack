import axios from "axios"

export type PerformanceEndpoint =
  | "ping"
  | "json"
  | "compute"
  | "databaseRead"
  | "databaseWrite"
export type PerformancePreset = "light" | "heavy" | "extreme"
export type PerformanceBackend = "nest" | "axum" | "elysia" | "spring"
export type PerformanceDatabase = "postgresql" | "mysql"

export interface PerformanceOptions {
  endpoint: PerformanceEndpoint
  size: number
  iterations: number
  limit: number
  count: number
  samples: number
  concurrency: number
}

export interface PerformanceResult {
  backend: PerformanceBackend
  database: PerformanceDatabase | "none"
  avg: number
  p50: number
  p95: number
  throughput: number
  successRate: number
  successful: number
  failed: number
}

export interface PerformanceBaseUrls {
  nest: string
  axum: string
  elysia: string
  spring: string
}

export interface PerformanceTarget {
  backend: PerformanceBackend
  database: PerformanceDatabase | "none"
  baseUrl: string
}

interface MeasureRecord {
  duration: number
  successful: boolean
}

type MeasureRequest = () => Promise<boolean>

export const performancePresets: Record<PerformancePreset, PerformanceOptions> = {
  light: {
    endpoint: "ping",
    size: 1000,
    iterations: 100000,
    limit: 100,
    count: 10,
    samples: 50,
    concurrency: 4,
  },
  heavy: {
    endpoint: "ping",
    size: 10000,
    iterations: 5000000,
    limit: 1000,
    count: 100,
    samples: 250,
    concurrency: 16,
  },
  extreme: {
    endpoint: "ping",
    size: 50000,
    iterations: 50000000,
    limit: 10000,
    count: 1000,
    samples: 1000,
    concurrency: 32,
  },
}

export function createPerformanceTargets(
  endpoint: PerformanceEndpoint,
  baseUrls: PerformanceBaseUrls,
): PerformanceTarget[] {
  const backends: Array<{ backend: PerformanceBackend; baseUrl: string }> = [
    { backend: "nest", baseUrl: baseUrls.nest },
    { backend: "axum", baseUrl: baseUrls.axum },
    { backend: "elysia", baseUrl: baseUrls.elysia },
    { backend: "spring", baseUrl: baseUrls.spring },
  ]
  if (endpoint !== "databaseRead" && endpoint !== "databaseWrite") {
    return backends.map((target) => ({ ...target, database: "none" }))
  }
  const databases: PerformanceDatabase[] = ["postgresql", "mysql"]
  return backends.flatMap((target) =>
    databases.map((database) => ({ ...target, database })),
  )
}

function percentile(sortedDurations: number[], percentage: number) {
  const index = Math.ceil(sortedDurations.length * percentage) - 1
  return sortedDurations[index]
}

export function calculatePerformance(
  durations: number[],
  successful: number,
  totalDuration: number,
) {
  const sortedDurations = [...durations].sort((left, right) => left - right)
  const total = durations.reduce((sum, duration) => sum + duration, 0)

  return {
    avg: total / durations.length,
    p50: percentile(sortedDurations, 0.5),
    p95: percentile(sortedDurations, 0.95),
    throughput: durations.length / (totalDuration / 1000),
    successRate: (successful / durations.length) * 100,
    successful,
    failed: durations.length - successful,
  }
}

async function runWorker(
  workerIndex: number,
  workerCount: number,
  options: PerformanceOptions,
  request: MeasureRequest,
) {
  const records: MeasureRecord[] = []
  for (let index = workerIndex; index < options.samples; index += workerCount) {
    const startedAt = performance.now()
    const successful = await request()
    records.push({
      duration: performance.now() - startedAt,
      successful,
    })
  }
  return records
}

function runSamples(options: PerformanceOptions, request: MeasureRequest) {
  const startedAt = performance.now()
  const workerCount = Math.min(options.concurrency, options.samples)
  const workers = Array.from({ length: workerCount }, (_, index) =>
    runWorker(index, workerCount, options, request),
  )

  return Promise.all(workers).then((workerRecords) => {
    const records = workerRecords.flat()
    const successful = records.filter((record) => record.successful).length
    return calculatePerformance(
      records.map((record) => record.duration),
      successful,
      performance.now() - startedAt,
    )
  })
}

export function measureRequests(options: PerformanceOptions, request: MeasureRequest) {
  return request().then(
    () => runSamples(options, request),
    () => runSamples(options, request),
  )
}

export function measureWriteRequests(
  options: PerformanceOptions,
  request: MeasureRequest,
  cleanup: MeasureRequest,
) {
  return measureRequests(options, request).then((result) =>
    cleanup().then(
      () => result,
      () => result,
    ),
  )
}

function createRequest(
  target: PerformanceTarget,
  options: PerformanceOptions,
  runId: string,
): MeasureRequest {
  const client = axios.create({
    baseURL: target.baseUrl,
    timeout: 30000,
  })

  return () => {
    if (options.endpoint === "ping") {
      return client.get("/benchmark/ping").then(
        () => true,
        () => false,
      )
    }
    if (options.endpoint === "json") {
      return client.get("/benchmark/json", { params: { size: options.size } }).then(
        () => true,
        () => false,
      )
    }
    if (options.endpoint === "compute") {
      return client
        .get("/benchmark/compute", { params: { iterations: options.iterations } })
        .then(
          () => true,
          () => false,
        )
    }
    if (options.endpoint === "databaseRead") {
      return client
        .get("/benchmark/database/read", {
          params: { database: target.database, limit: options.limit },
        })
        .then(
          () => true,
          () => false,
        )
    }
    return client
      .post(
        "/benchmark/database/write",
        {},
        {
          params: {
            database: target.database,
            count: options.count,
            runId,
          },
        },
      )
      .then(
        () => true,
        () => false,
      )
  }
}

function createCleanup(target: PerformanceTarget, runId: string): MeasureRequest {
  const client = axios.create({
    baseURL: target.baseUrl,
    timeout: 30000,
  })
  return () =>
    client.delete(`/benchmark/database/write/${runId}`, {
      params: { database: target.database },
    }).then(
      () => true,
      () => false,
    )
}

export async function runPerformanceTests(options: PerformanceOptions) {
  const targets = createPerformanceTargets(options.endpoint, {
    nest: import.meta.env.VITE_BACKEND_NEST_URL,
    axum: import.meta.env.VITE_BACKEND_AXUM_URL,
    elysia: import.meta.env.VITE_BACKEND_ELYSIA_URL,
    spring: import.meta.env.VITE_BACKEND_SPRING_URL,
  })

  const results: PerformanceResult[] = []
  for (const target of targets) {
    if (options.endpoint !== "databaseWrite") {
      const result = await measureRequests(options, createRequest(target, options, ""))
      results.push({
        backend: target.backend,
        database: target.database,
        ...result,
      })
      continue
    }
    const runId = crypto.randomUUID()
    const result = await measureWriteRequests(
      options,
      createRequest(target, options, runId),
      createCleanup(target, runId),
    )
    results.push({
      backend: target.backend,
      database: target.database,
      ...result,
    })
  }
  return results
}
