import { beforeEach, describe, expect, it } from "vitest"
import { writeAccessToken } from "./http"

describe("writeAccessToken", () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it("stores access token in sessionStorage", () => {
    writeAccessToken("token-1")
    expect(sessionStorage.getItem("accessToken")).toBe("token-1")
  })

  it("clears access token when empty", () => {
    writeAccessToken("token-1")
    writeAccessToken("")
    expect(sessionStorage.getItem("accessToken")).toBeNull()
  })
})
