import { describe, expect, it } from "vitest"
import { errorHandler } from "./error-handler"

describe("errorHandler", () => {
  it("returns validation errors", () => {
    expect(errorHandler("VALIDATION", "invalid query")).toEqual({
      status: 400,
      body: {
        code: 10001,
        message: "invalid query",
        data: {},
      },
    })
  })

  it("returns internal errors", () => {
    expect(errorHandler("INTERNAL", "Internal Server Error")).toEqual({
      status: 500,
      body: {
        code: 10007,
        message: "Internal Server Error",
        data: {},
      },
    })
  })
})
