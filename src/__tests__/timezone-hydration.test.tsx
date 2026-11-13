import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import RegisterPage from "@/app/(public)/register/page";
import CompleteProfilePage from "@/app/(public)/complete-profile/page";
import { detectTimezone } from "@/lib/timezones";

// The server's timezone is the host's, not the visitor's. If a page renders
// it, the server HTML disagrees with the browser's first render and React
// raises a hydration error (Sentry, /register, Nov 2026). The server render
// must stay zone-free; the browser fills the detected zone in afterwards.
const zoneLabel = detectTimezone().replaceAll("_", " ");

describe.each([
  ["register", RegisterPage],
  ["complete-profile", CompleteProfilePage],
])("timezone picker on %s", (_name, Page) => {
  it("server-renders without a detected zone", () => {
    const html = renderToString(<Page />);
    expect(html).toContain('aria-label="Timezone"');
    expect(html).not.toContain(zoneLabel);
  });

  it("shows the detected zone in the browser", () => {
    render(<Page />);
    expect(screen.getByRole("combobox", { name: "Timezone" })).toHaveTextContent(zoneLabel);
  });
});
