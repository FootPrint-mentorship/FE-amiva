import "@testing-library/jest-dom/vitest";
import { vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { resetAllStores } from "@/lib/store";
import { settingsStore } from "@/lib/stores";
import { makeAdaSettings } from "./fixtures";
import { reset as resetFakeApi } from "./fake-api";

// Tests run self-contained against the in-memory fake of the api() boundary
// (the mock mode inside the runtime was retired 17 Aug 2026).
vi.mock("@/lib/api/client", () => import("./fake-api"));

afterEach(cleanup);
beforeEach(async () => {
  resetFakeApi(); // pristine fixture database + live session
  resetAllStores(); // shared stores must not leak between tests
  // Pages render without the app layout, whose loadMe() would fill the
  // settings store from /users/me — seed it with the same Ada profile the
  // fake's auth endpoints answer with.
  settingsStore.set(() => makeAdaSettings());
  const { queryClient } = await import("@/lib/query");
  queryClient.clear(); // …nor the query cache (collections refetch per test)
});

// jsdom lacks scrollIntoView (used by the chat thread autoscroll).
Element.prototype.scrollIntoView = vi.fn();

// next/image → plain <img> (strip Next-only props so React doesn't warn).
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, priority: _priority, ...rest } = props;
    return (
      // eslint-disable-next-line @next/next/no-img-element -- this IS the test double for next/image
      <img src={typeof src === "string" ? src : ""} alt={String(alt ?? "")} {...rest} />
    );
  },
}));

// next/navigation → controllable stubs. Tests read/write via `nav` below.
type NavState = {
  push: ReturnType<typeof vi.fn>;
  pathname: string;
  search: string;
};

export const nav: NavState = {
  push: vi.fn(),
  pathname: "/app/today",
  search: "",
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, replace: vi.fn(), back: vi.fn() }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}));

beforeEach(() => {
  nav.push = vi.fn();
  nav.pathname = "/app/today";
  nav.search = "";
});
