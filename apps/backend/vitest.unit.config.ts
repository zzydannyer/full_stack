import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    name: "unit",
    include: ["src/**/*.unit.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 20,
        functions: 20,
        branches: 15,
        statements: 20,
      },
    },
  },
})
