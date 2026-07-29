import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "e2e",
    include: ["src/**/*.e2e.test.ts"],
    environment: "node",
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
})
