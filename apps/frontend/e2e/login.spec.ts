import { expect, test } from "@playwright/test"

test("login page renders", async ({ page }) => {
  await page.route("**/api/auth/refresh", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ code: 10002, message: "unauthorized", data: {} }),
    })
  })
  await page.goto("/login")
  await expect(page.getByRole("button", { name: /登录|Login/i })).toBeVisible()
})
