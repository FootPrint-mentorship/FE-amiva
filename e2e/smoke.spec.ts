import { test, expect } from "@playwright/test";

/**
 * Critical-journey smoke in self-contained mock mode:
 * register (inline email OTP) → skip onboarding → Today → create a
 * reminder → sign out. Mirrors the spec's build-order check for the
 * register → reminder journey; WhatsApp delivery itself can't be asserted
 * from a browser, so the reminder appearing (with tz shown) is the proof.
 */

test("register → onboarding skip → today → create reminder → sign out", async ({ page }) => {
  await page.goto("/register");

  await page.getByPlaceholder("Ada Obi").fill("Smoke Tester");
  await page.getByPlaceholder("you@example.com").fill("smoke.tester@example.com");
  await page.getByPlaceholder("8012345678").fill("8010000000");
  await page.getByPlaceholder("At least 8 characters").fill("Sm0ke!Passw0rd");

  // Inline email OTP (mock accepts any 6 digits)
  await page.getByRole("button", { name: "Send code" }).click();
  for (let i = 1; i <= 6; i++) {
    await page.getByLabel(`Email code digit ${i}`).fill(String(i));
  }
  await expect(page.getByText("Email verified", { exact: true })).toBeVisible();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();

  // Onboarding wizard → skip straight to the app
  await expect(page.getByRole("button", { name: /Skip onboarding/ })).toBeVisible();
  await page.getByRole("button", { name: /Skip onboarding/ }).click();
  await expect(page).toHaveURL(/\/app\/today/);
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

  // Create a reminder
  await page.getByRole("link", { name: "Reminders" }).click();
  await expect(page).toHaveURL(/\/app\/reminders/);
  await page.getByRole("button", { name: "New reminder" }).click();
  await page.getByLabel("Remind me to…").fill("Water the plants");
  // Default time is 09:00 today — pick tomorrow so it's never in the past.
  const tomorrow = new Date(Date.now() + 24 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  await page
    .getByLabel("Date")
    .fill(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`);
  await page.getByRole("button", { name: "Create reminder" }).click();
  await expect(page.getByText("Water the plants").first()).toBeVisible();

  // Timezone is always visible on absolute times (PRD: zero silent tz errors)
  await expect(page.getByText(/WAT/).first()).toBeVisible();

  // Sign out returns to login
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("search palette answers honestly when nothing matches", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder(/you@example.com or/).fill("smoke.tester@example.com");
  await page.getByPlaceholder("••••••••").fill("Sm0ke!Passw0rd");
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/app\/today/);
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

  await page.getByRole("button", { name: /Search or ask Amiva/ }).click();
  const input = page.getByRole("textbox", { name: "Search or ask Amiva" });
  await expect(input).toBeVisible();
  await input.fill("something that certainly is not here");
  await input.press("Enter");
  await expect(page.getByText(/couldn't find that/)).toBeVisible({ timeout: 5_000 });
});
