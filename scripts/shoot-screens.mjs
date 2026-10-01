// Regenerates the real-app screenshots the marketing page uses
// (public/screens/*.png). Run against a LOCAL dev server + local backend
// whose test account has been seeded with presentable data:
//
//   npm run dev            # in one terminal
//   node scripts/shoot-screens.mjs
//
// Desktop captures are 1440 wide @2x; the phone captures are 390x844 @3x
// and are shown below the md breakpoint by <AppScreenshot> on the home page.
import { chromium } from "playwright";

const base = process.env.BASE_URL || "http://localhost:3000";
const email = process.env.SHOT_EMAIL || "ui.test@example.com";
const password = process.env.SHOT_PASSWORD || "Str0ng!Passw0rd";
const OUT = new URL("../public/screens/", import.meta.url).pathname;

const HIDE_DEV_BADGE = "nextjs-portal{display:none!important}";

async function login(page) {
  await page.goto(`${base}/login`, { waitUntil: "networkidle" });
  await page.locator('input:not([type="password"])').first().fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/app/, { timeout: 20000 });
}

async function shoot(page, path, file) {
  await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
  await page.addStyleTag({ content: HIDE_DEV_BADGE });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}${file}` });
  console.log("wrote", file);
}

const browser = await chromium.launch();
const common = { timezoneId: "Africa/Lagos", locale: "en-GB" };

// Desktop: Today at 1440x840, Chat at 1440x900 (keeps the first bubble whole).
const desktop = await browser.newContext({ ...common, viewport: { width: 1440, height: 840 }, deviceScaleFactor: 2 });
const d = await desktop.newPage();
await login(d);
await shoot(d, "/app/today", "today.png");
await d.setViewportSize({ width: 1440, height: 900 });
await shoot(d, "/app/chat", "chat.png");
await desktop.close();

// Phone
const phone = await browser.newContext({ ...common, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
const p = await phone.newPage();
await login(p);
await shoot(p, "/app/today", "today-mobile.png");
await shoot(p, "/app/chat", "chat-mobile.png");
await phone.close();

await browser.close();
