import { describe, expect, it } from "vitest"
import { createComputeResult, createJsonResult } from "./service"

describe("createJsonResult", () => {
  it("creates the expected JSON records", () => {
    expect(createJsonResult(3)).toEqual({
      count: 3,
      items: [
        { index: 0, name: "record-0", active: true, score: 0 },
        { index: 1, name: "record-1", active: false, score: 17 },
        { index: 2, name: "record-2", active: true, score: 34 },
      ],
    })
  })

  it("supports the minimum and maximum sizes", () => {
    expect(createJsonResult(1)).toEqual({
      count: 1,
      items: [{ index: 0, name: "record-0", active: true, score: 0 }],
    })

    const maximum = createJsonResult(50000)
    expect(maximum.count).toBe(50000)
    expect(maximum.items[49999]).toEqual({
      index: 49999,
      name: "record-49999",
      active: false,
      score: 983,
    })
  })
})

describe("createComputeResult", () => {
  it("calculates the LCG checksum", () => {
    expect(createComputeResult(3)).toEqual({
      iterations: 3,
      checksum: 3519870697,
    })
  })

  it("supports the minimum iteration boundary", () => {
    expect(createComputeResult(1)).toEqual({
      iterations: 1,
      checksum: 1013904223,
    })
  })
})
