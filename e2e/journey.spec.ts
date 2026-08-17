import { execSync } from "node:child_process";
import { test, expect } from "@playwright/test";

/**
 * Real-stack e2e journey (mock mode retired 17 Aug 2026): registration with
 * the real emailed OTP (read from the backend's dev log), reminder creation,
 * the chat assistant, honest search, and the sign-out confirm — all against
 * `docker compose up -d app worker` in ../BE-amiva.
 *
 * Serial: later tests log in with the account test 1 registers.
 */

test.describe.configure({ mode: "serial" });

const RUN = Date.now().toString(36);
const EMAIL = `qa.journey+${RUN}@example.com`;
const PASSWORD = "Qa!Journey1234";

/** The dev stack logs outbound email instead of sending (no SMTP creds):
 * `email (dev log) to=<addr> … Your verification code is 123456`. */
function emailedOtp(email: string): string {
  const logs = execSync("docker compose logs app --since 5m --no-color", {
    cwd: "../BE-amiva",
    encoding: "utf8",
  });
  const line = logs
    .split("\n")
    .filter((l) => l.includes(`to=${email}`) && l.includes("code is"))
    .at(-1);
  const code = line?.match(/code is (\d{6})/)?.[1];
  if (!code) throw new Error(`no OTP dev-logged for ${email} — is SMTP accidentally configured?`);
  return code;
}

test("register with real OTP → onboarding skip → today → create reminder → sign out", async ({ page }) => {
  await page.goto("/register");

  await page.getByPlaceholder("Ada Obi").fill("QA Journey");
  await page.getByPlaceholder("you@example.com").fill(EMAIL);
  await page.getByPlaceholder("At least 8 characters").fill(PASSWORD);

  await page.getByRole("button", { name: "Send code" }).click();
  await expect
    .poll(() => {
      try {
        return emailedOtp(EMAIL);
      } catch {
        return null;
      }
    }, { timeout: 15_000 })
    .not.toBeNull();
  const code = emailedOtp(EMAIL);
  for (let i = 0; i < 6; i++) {
    await page.getByLabel(`Email code digit ${i + 1}`).fill(code[i]);
  }
  await expect(page.getByText("Email verified", { exact: true })).toBeVisible();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();

  // Onboarding wizard → skip straight to the app
  await expect(page.getByRole("button", { name: /Skip onboarding/ })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: /Skip onboarding/ }).click();
  await expect(page).toHaveURL(/\/app\/today/);
  await expect(page.getByRole("heading", { name: /Good (morning|afternoon|evening)/ })).toBeVisible();

  // Create a reminder for tomorrow (never in the past)
  await page.getByRole("link", { name: "Reminders" }).click();
  await page.getByRole("button", { name: "New reminder" }).click();
  await page.getByLabel("Remind me to…").fill("Water the plants");
  const tomorrow = new Date(Date.now() + 24 * 3600_000);
  const pad = (n: number) => String(n).padStart(2, "0");
  await page
    .getByLabel("Date")
    .fill(`${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`);
  await page.getByRole("button", { name: "Create reminder" }).click();
  await expect(page.getByText("Water the plants").first()).toBeVisible();

  // Timezone always visible on absolute times (PRD: zero silent tz errors)
  await expect(page.getByText(/WAT|GMT|[A-Z]{2,4}T/).first()).toBeVisible();

  // Sign out asks for confirmation first, then returns to login
  await page.getByRole("button", { name: "Sign out" }).click();
  const confirm = page.getByRole("dialog", { name: "Confirm sign out" });
  await expect(confirm.getByText("Sign out of Amiva?")).toBeVisible();
  await confirm.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("login → chat assistant creates a reminder → search answers honestly", async ({ page }) => {
  await page.goto("/login");
  await page.getByPlaceholder(/you@example.com or/).fill(EMAIL);
  await page.getByPlaceholder("••••••••").fill(PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/app\/today/, { timeout: 15_000 });

  // Chat → the assistant (rule-based fallback or live LLM) sets a reminder
  await page.getByRole("link", { name: "Chat" }).click();
  const composer = page.getByLabel("Message Amiva");
  const title = `journey check ${RUN}`;
  await composer.fill(`Remind me to ${title} tomorrow at 9am`);
  await composer.press("Enter");
  await expect(page.getByText(/Reminder set/).first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/9:00\s?AM/i).first()).toBeVisible();

  // Search: honest not-found instead of fabrication (PRD hard rule)
  await page.getByRole("button", { name: /Search or ask Amiva/ }).click();
  const input = page.getByRole("textbox", { name: "Search or ask Amiva" });
  await input.fill("something that certainly is not here");
  await input.press("Enter");
  await expect(page.getByText(/couldn't find/i)).toBeVisible({ timeout: 10_000 });
});
