import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

// next-intl without i18n routing: locale comes from the request config.
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Defence-in-depth headers for every route. A Content-Security-Policy is
// deliberately not set here yet: the inline bootstrap scripts in layout.tsx
// need hashes/nonces first — roll it out as Report-Only before enforcing.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

// Source-map upload happens only when SENTRY_AUTH_TOKEN is present in the
// build environment (Netlify); without it the wrapper is inert and the build
// is unchanged — local `next build` needs no Sentry account.
export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  // Maps are for Sentry's symbolication only — never served to browsers.
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  disableLogger: true,
  telemetry: false,
});
