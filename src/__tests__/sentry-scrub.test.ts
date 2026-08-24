import { describe, it, expect } from "vitest";
import { scrubBreadcrumb, scrubEvent, scrubText } from "@/lib/sentry-scrub";

// NDPA/POPIA posture (mirrors the backend's app/core/sentry.py tests):
// numbers/JIDs/emails never leave the browser in a Sentry event.
describe("Sentry PII scrubbing", () => {
  it("removes emails, phone numbers and WhatsApp JIDs from text", () => {
    const out = scrubText(
      "grace.ede@example.com wrote from 2349058155331@lid and +2348012345678"
    );
    expect(out).not.toMatch(/example\.com|2349058155331|2348012345678/);
    expect(out).toContain("[email]");
    expect(out).toContain("[number]");
  });

  it("keeps resource ids and short numbers untouched", () => {
    const s = "reminder rem_01a030eeb52d7cb8a73b39283c63def4 code 482913";
    expect(scrubText(s)).toBe(s);
  });

  it("scrubs event carriers and drops request data and user identity", () => {
    const out = scrubEvent({
      message: "delivery to 2348012345678 failed",
      breadcrumbs: { values: [{ message: "sent to a@b.com" }] },
      exception: { values: [{ value: "otp for +2349058155331 bounced" }] },
      request: {
        url: "https://tryamiva.com/app",
        data: { phone: "+2348012345678" },
        cookies: "s=1",
        query_string: "email=a@b.com",
        headers: { Authorization: "Bearer x" },
      },
      user: { ip_address: "1.2.3.4" },
    });
    expect(out.message).not.toContain("2348012345678");
    expect(out.breadcrumbs.values[0].message).toBe("sent to [email]");
    expect(out.exception.values[0].value).not.toContain("2349058155331");
    expect(out.request.data).toBeUndefined();
    expect(out.request.cookies).toBeUndefined();
    expect(out.request.query_string).toBeUndefined();
    expect(out.request.headers).toEqual({});
    expect(out.user).toBeUndefined();
  });

  it("scrubs nested breadcrumb data", () => {
    const out = scrubBreadcrumb({
      message: "to 2349058155331@c.us",
      data: { list: ["x@y.com"] },
    });
    expect(out.message).not.toContain("2349058155331");
    expect(out.data.list[0]).toBe("[email]");
  });
});
