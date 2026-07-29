import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "api",
    include: ["src/**/*.api.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
