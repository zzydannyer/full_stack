import { describe, expect, it, vi } from "vitest"
import {
  calculatePerformance,
  createPerformanceControl,
  createPerformanceTargets,
  createRunId,
  measureRequests,
  measureWriteRequests,
  performancePresets,
  type PerformanceOptions,
} from "./measure"

describe("performance measurement", () => {
  it("calculates latency, throughput, and request counts", () => {
    const result = calculatePerformance([40, 10, 30, 20], 3, 2000)

    expect(result).toEqual({
      avg: 25,
      p50: 20,
      p95: 40,
      throughput: 2,
      successRate: 75,
      successful: 3,
      failed: 1,
    })
  })

  it("provides light, heavy, and maximum extreme presets", () => {
    expect(performancePresets.light).toMatchObject({
      size: 1000,
      iterations: 100000,
      limit: 100,
      count: 10,
      samples: 50,
      concurrency: 4,
    })
    expect(performancePresets.heavy).toMatchObject({
      size: 10000,
      iterations: 5000000,
      limit: 1000,
      count: 100,
      samples: 250,
      concurrency: 16,
    })
    expect(performancePresets.extreme).toMatchObject({
      size: 50000,
      iterations: 50000000,
      limit: 10000,
      count: 1000,
      samples: 1000,
      concurrency: 32,
    })
  })

  it("keeps failed requests visible after the excluded warm-up", async () => {
    const request = vi.fn<() => Promise<boolean>>().mockResolvedValue(false)
    const result = await measureRequests(
      {
        ...performancePresets.light,
        endpoint: "ping",
        samples: 4,
        concurrency: 2,
      },
      request,
    )

    expect(request).toHaveBeenCalledTimes(5)
    expect(result.successful).toBe(0)
    expect(result.failed).toBe(4)
  })

  it("creates four non-database targets", () => {
    const targets = createPerformanceTargets("json", {
      nest: "/api",
      axum: "/backend-axum",
      elysia: "/backend-elysia",
      spring: "/backend-spring",
    })

    expect(targets).toEqual([
      { backend: "nest", database: "none", baseUrl: "/api" },
      { backend: "axum", database: "none", baseUrl: "/backend-axum" },
      { backend: "elysia", database: "none", baseUrl: "/backend-elysia" },
      { backend: "spring", database: "none", baseUrl: "/backend-spring" },
    ])
  })

  it("creates eight database targets", () => {
    const targets = createPerformanceTargets("databaseRead", {
      nest: "/api",
      axum: "/backend-axum",
      elysia: "/backend-elysia",
      spring: "/backend-spring",
    })

    expect(targets).toHaveLength(8)
    expect(targets.map(({ backend, database }) => `${backend}-${database}`)).toEqual([
      "nest-postgresql",
      "nest-mysql",
      "axum-postgresql",
      "axum-mysql",
      "elysia-postgresql",
      "elysia-mysql",
      "spring-postgresql",
      "spring-mysql",
    ])
  })

  it("cleans up writes after timed measurement", async () => {
    const options: PerformanceOptions = {
      ...performancePresets.light,
      endpoint: "databaseWrite",
      samples: 1,
      concurrency: 1,
    }
    vi.spyOn(performance, "now")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(10)
      .mockReturnValueOnce(30)
      .mockReturnValueOnce(40)
      .mockReturnValue(1040)
    const request = vi.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const cleanup = vi.fn<() => Promise<boolean>>().mockImplementation(() => {
      performance.now()
      return Promise.resolve(true)
    })

    const result = await measureWriteRequests(options, request, cleanup)

    expect(cleanup).toHaveBeenCalledOnce()
    expect(request).toHaveBeenCalledTimes(2)
    expect(result.avg).toBe(20)
    expect(result.throughput).toBe(25)
  })

  it("stops issuing samples after cancel", async () => {
    const control = createPerformanceControl()
    let calls = 0
    const request = vi.fn<() => Promise<boolean>>().mockImplementation(() => {
      calls += 1
      if (calls === 2) control.cancel()
      return Promise.resolve(true)
    })

    const result = await measureRequests(
      {
        ...performancePresets.light,
        endpoint: "ping",
        samples: 8,
        concurrency: 1,
      },
      request,
      control,
    )

    expect(control.cancelled).toBe(true)
    expect(request.mock.calls.length).toBeLessThan(9)
    expect(result.successful + result.failed).toBeLessThan(8)
  })

  it("creates run ids without randomUUID", () => {
    expect(createRunId()).toMatch(/^[0-9a-f]{32}$/)
    expect(createRunId()).not.toBe(createRunId())
  })

  it("resumes samples after pause", async () => {
    const control = createPerformanceControl()
    let calls = 0
    const request = vi.fn<() => Promise<boolean>>().mockImplementation(() => {
      calls += 1
      if (calls === 2) {
        control.pause()
        setTimeout(() => control.resume(), 0)
      }
      return Promise.resolve(true)
    })

    const result = await measureRequests(
      {
        ...performancePresets.light,
        endpoint: "ping",
        samples: 3,
        concurrency: 1,
      },
      request,
      control,
    )

    expect(request).toHaveBeenCalledTimes(4)
    expect(result.successful).toBe(3)
  })
})
