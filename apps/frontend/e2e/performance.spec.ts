import { expect, test } from "@playwright/test"

test("renders four service cards and eight database cards", async ({ page }) => {
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ code: 10002, message: "unauthorized", data: {} }),
    })
  })
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        message: "ok",
        data: {
          token: { accessToken: "performance-token", expiresIn: 900 },
          user: {
            id: "performance-admin",
            username: "admin",
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
            disabled: false,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
          },
        },
      }),
    })
  })
  let benchmarkRequests = 0
  let activeBenchmarkRequests = 0
  let maximumBenchmarkRequests = 0
  await page.route("**/benchmark/**", async (route) => {
    benchmarkRequests += 1
    activeBenchmarkRequests += 1
    maximumBenchmarkRequests = Math.max(maximumBenchmarkRequests, activeBenchmarkRequests)
    await new Promise((resolve) => setTimeout(resolve, 10))
    const failed = route.request().url().includes("/backend-spring/")
    await route.fulfill({
      status: failed ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify({
        code: 0,
        message: "ok",
        data: { status: "ok" },
      }),
    })
    activeBenchmarkRequests -= 1
  })

  await page.goto("/login")
  await page.getByLabel(/账号|Account/i).fill("admin")
  await page.getByLabel(/密码|Password/i).fill("888888")
  await page.getByRole("button", { name: /^登录$|^Login$/i }).click()

  await page.getByRole("link", { name: /极限性能套件|Extreme performance/i }).click()
  await expect(page).toHaveURL(/\/performance$/)
  await expect(page.getByText(/样本数（1–5000）|Samples \(1–5000\)/i)).toBeVisible()
  await expect(page.getByText(/并发数（1–64）|Concurrency \(1–64\)/i)).toBeVisible()
  const runButton = page.getByRole("button", { name: /运行套件|Run suite/i })
  await page.getByLabel(/样本数|Samples/i).fill("5001")
  await page.getByLabel(/并发数|Concurrency/i).fill("65")
  await runButton.click()
  await expect(
    page.getByText(/样本数必须在 1–5000 之间|Samples must be between 1 and 5000/i),
  ).toBeVisible()
  await expect(
    page.getByText(/并发数必须在 1–64 之间|Concurrency must be between 1 and 64/i),
  ).toBeVisible()
  expect(benchmarkRequests).toBe(0)

  await page.getByLabel(/样本数|Samples/i).fill("1")
  await page.getByLabel(/并发数|Concurrency/i).fill("1")

  await runButton.click()
  await expect(page.getByTestId("performance-result-nest")).toBeVisible()
  await expect(page.getByTestId("performance-result-axum")).toBeVisible()
  await expect(page.getByTestId("performance-result-elysia")).toBeVisible()
  await expect(page.getByTestId("performance-result-spring")).toBeVisible()
  await expect(page.getByTestId("performance-result-spring")).toContainText(/失败|Failed/i)
  await expect(page.getByTestId("performance-chart")).toBeVisible()
  expect(maximumBenchmarkRequests).toBe(1)

  await page.getByLabel(/测试套件|Suite/i).click()
  await page.getByRole("option", { name: /数据库读取|Database read/i }).click()
  await runButton.click()
  await expect(page.locator('[data-testid^="performance-result-"]')).toHaveCount(8)
  await expect(page.getByTestId("performance-result-nest-postgresql")).toBeVisible()
  await expect(page.getByTestId("performance-result-nest-mysql")).toBeVisible()
  await expect(page.getByTestId("performance-result-axum-postgresql")).toBeVisible()
  await expect(page.getByTestId("performance-result-axum-mysql")).toBeVisible()
  await expect(page.getByTestId("performance-result-elysia-postgresql")).toBeVisible()
  await expect(page.getByTestId("performance-result-elysia-mysql")).toBeVisible()
  await expect(page.getByTestId("performance-result-spring-postgresql")).toBeVisible()
  await expect(page.getByTestId("performance-result-spring-mysql")).toBeVisible()
})
