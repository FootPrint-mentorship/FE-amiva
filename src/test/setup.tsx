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

// next-intl → a tiny double over messages/en.json: real keys (a typo throws),
// {placeholder} interpolation and t.rich(<tag>…</tag>). Pages render without
// the localized layouts, so there is no provider to supply messages.
import en from "../../messages/en.json";

vi.mock("next-intl", () => {
  type Values = Record<string, unknown>;
  const lookup = (ns: string | undefined, key: string): string => {
    let cur: unknown = en;
    for (const part of (ns ? `${ns}.${key}` : key).split(".")) {
      cur = (cur as Record<string, unknown> | undefined)?.[part];
    }
    if (typeof cur !== "string") throw new Error(`Missing message: ${ns}.${key}`);
    return cur;
  };
  const fill = (s: string, values?: Values) =>
    s.replace(/\{(\w+)\}/g, (m, k) => (values && k in values ? String(values[k]) : m));
  const rich = (s: string, values?: Values): React.ReactNode[] => {
    const out: React.ReactNode[] = [];
    const re = /<(\w+)>(.*?)<\/\1>/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let i = 0;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push(fill(s.slice(last, m.index), values));
      const fn = values?.[m[1]];
      const inner = fill(m[2], values);
      out.push(
        typeof fn === "function"
          ? React.cloneElement((fn as (c: React.ReactNode) => React.ReactElement)(inner), { key: i++ })
          : inner,
      );
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push(fill(s.slice(last), values));
    return out;
  };
  const useTranslations = (ns?: string) => {
    const t = ((key: string, values?: Values) => fill(lookup(ns, key), values)) as ((
      key: string,
      values?: Values,
    ) => string) & { rich: (key: string, values?: Values) => React.ReactNode[] };
    t.rich = (key: string, values?: Values) => rich(lookup(ns, key), values);
    return t;
  };
  return {
    useTranslations,
    useLocale: () => "en",
    NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

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
