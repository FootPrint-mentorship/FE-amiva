import "@testing-library/jest-dom/vitest";
import { vi, beforeEach, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import React from "react";
import { resetAllStores } from "@/lib/store";

// Tests always run self-contained on the mock stores.
process.env.NEXT_PUBLIC_USE_MOCKS = "1";

afterEach(cleanup);
beforeEach(() => resetAllStores()); // shared stores must not leak between tests

// jsdom lacks scrollIntoView (used by the chat thread autoscroll).
Element.prototype.scrollIntoView = vi.fn();

// next/image → plain <img> (strip Next-only props so React doesn't warn).
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt, priority: _priority, ...rest } = props;
    return (
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
