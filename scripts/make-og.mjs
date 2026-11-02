// Renders scripts/og-template.html to public/og.png (1200×630) with the
// project's Playwright Chromium. Run after changing the headline or tagline:
//   node scripts/make-og.mjs
// Added 2 Nov 2026 with the "reminder service" repositioning; before this the
// OG image had no generator and its text drifted from the page copy.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const template = path.join(here, "og-template.html");
const out = path.join(here, "..", "public", "og.png");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`file://${template}`, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: "png" });
await browser.close();
console.log(`wrote ${out}`);
