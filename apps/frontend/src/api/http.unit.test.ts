import { beforeEach, describe, expect, it } from "vitest"
import { readAccessToken, writeAccessToken } from "./http"

describe("access token memory", () => {
  beforeEach(() => {
    writeAccessToken("")
  })

  it("stores access token in memory", () => {
    writeAccessToken("token-1")
    expect(readAccessToken()).toBe("token-1")
  })

  it("clears access token when empty", () => {
    writeAccessToken("token-1")
    writeAccessToken("")
    expect(readAccessToken()).toBe("")
  })
})
