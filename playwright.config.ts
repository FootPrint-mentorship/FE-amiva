import { defineConfig } from "@playwright/test";

/**
 * Real-browser e2e layer (the jsdom suite lives in src/__tests__).
 *
 * Mock mode was retired (17 Aug 2026), so e2e ALWAYS runs against the real
 * BE-amiva stack: `docker compose up -d app worker` in ../BE-amiva first.
 * The suite builds and serves a production bundle on :3100 pointed at the
 * local API (NEXT_PUBLIC_* is baked at build time, hence env on the build).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    // A second `next dev` in the same dir is refused (Next 16 lock), so the
    // e2e layer runs the production build.
    command: "npm run build && npx next start --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_API_BASE_URL:
        process.env.E2E_API_BASE_URL ?? "http://localhost:8000/api/v1",
    },
    timeout: 300_000,
  },
});
