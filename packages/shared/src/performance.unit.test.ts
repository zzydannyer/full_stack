import { describe, expect, it } from "vitest"
import {
  performanceCleanupVO,
  performanceComputeVO,
  performanceDatabaseDTO,
  performanceJsonVO,
  performancePingVO,
  performanceReadVO,
  performanceWriteVO,
} from "./performance.js"

describe("performance contracts", () => {
  it("accepts the ping response data", () => {
    const result = performancePingVO.parse({ status: "ok" })
    expect(result.status).toBe("ok")
  })

  it("rejects a different ping status", () => {
    const result = performancePingVO.safeParse({ status: "down" })
    expect(result.success).toBe(false)
  })

  it("accepts the extreme benchmark payloads", () => {
    expect(performanceDatabaseDTO.parse("mysql")).toBe("mysql")
    expect(
      performanceJsonVO.parse({
        count: 1,
        items: [{ index: 0, name: "record-0", active: true, score: 0 }],
      }).count,
    ).toBe(1)
    expect(performanceComputeVO.parse({ iterations: 1, checksum: 1013904223 }).checksum).toBe(
      1013904223,
    )
    expect(
      performanceReadVO.parse({
        database: "postgresql",
        count: 1,
        items: [
          {
            id: 1,
            runId: "seed",
            payload: "benchmark-0",
            score: 0,
            createdAt: "2026-07-30T00:00:00.000Z",
          },
        ],
      }).count,
    ).toBe(1)
    expect(performanceWriteVO.parse({ database: "mysql", runId: "run-1", count: 1 }).count).toBe(1)
    expect(
      performanceCleanupVO.parse({ database: "mysql", runId: "run-1", deleted: 1 }).deleted,
    ).toBe(1)
  })
})
