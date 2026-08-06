import { test, expect } from "@playwright/test";

/**
 * Optional smoke against the real BE-amiva stack. Opt in with:
 *   E2E_REAL=1 E2E_EMAIL=you@example.com E2E_PASSWORD=… npx playwright test real-backend
 * Requires `docker compose up -d app worker` in ../BE-amiva and a dev server
 * in real-API mode on :3000 (this spec ignores the mock-mode webServer port).
 */

const REAL = process.env.E2E_REAL === "1";
const BASE = "http://localhost:3000";
const EMAIL = process.env.E2E_EMAIL ?? "grace.ede@example.com";
const PASSWORD = process.env.E2E_PASSWORD ?? "Str0ng!Passw0rd";

test.skip(!REAL, "set E2E_REAL=1 (backend + real-mode dev server required)");

test("login → chat creates a real reminder via the assistant", async ({ page }) => {
  await page.goto(`${BASE}/login`);
  await page.getByPlaceholder(/you@example.com or/).fill(EMAIL);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/app\/today/, { timeout: 15_000 });

  await page.getByRole("link", { name: "Chat" }).click();
  const composer = page.getByLabel("Message Amiva");
  const title = `smoke check ${Date.now().toString(36)}`;
  await composer.fill(`Remind me to ${title} tomorrow at 9am`);
  await composer.press("Enter");

  // The rule-based dev parser answers with the scheduled reminder.
  await expect(page.getByText(/Reminder set for/)).toBeVisible({ timeout: 15_000 });

  await page.getByRole("link", { name: "Reminders" }).click();
  await expect(page.getByText(title)).toBeVisible({ timeout: 10_000 });
});
