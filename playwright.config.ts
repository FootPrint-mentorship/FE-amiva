import { defineConfig } from "@playwright/test";

/**
 * Real-browser smoke layer (the jsdom suite lives in src/__tests__).
 *
 * Runs the app in self-contained mock mode on its own port so it never
 * clashes with a dev server or needs the backend. The optional
 * real-backend spec (e2e/real-backend.spec.ts) is skipped unless
 * E2E_REAL=1 and the BE-amiva stack is up on :8000.
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
    // smoke layer runs the production build. NEXT_PUBLIC_* is baked at build
    // time, so the env must be set on the build, not just the server.
    command: "npm run build && npx next start --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    env: { NEXT_PUBLIC_USE_MOCKS: "1" },
    timeout: 300_000,
  },
});
