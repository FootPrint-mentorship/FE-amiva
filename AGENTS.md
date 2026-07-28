<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Amiva Web — Project Context

Frontend for **Amiva**, an AI personal assistant ("chief of staff") delivered through WhatsApp with this web dashboard as the second surface. This one Next.js app contains both the **public marketing site** (`/`) and the **authenticated web app** (`/app/*`).

## Read these first

| Document | What it is |
|---|---|
| `AMIVA-FRONTEND-SPEC.md` (this folder) | **The source of truth for everything built here.** Design tokens, per-screen specs (Purpose/Route/Data/Layout/States/Acceptance), component inventory, build order. Follow it; if you deviate, update it. |
| `../BE-amiva/AMIVA-BACKEND-SPEC.md` | The API contract this frontend consumes (the backend project now lives in `../BE-amiva/`): every endpoint, request/response shape, error codes. Mock data mirrors these shapes exactly. |
| `../Amiva Product Requirements Document (PRD) v1.0.pdf` | Product requirements (the why). |
| `../Amiva Brand Guideline.pdf` | Brand identity. Tokens already extracted into `src/app/globals.css`. |

## Stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS v4 (CSS-based config via `@theme` in `src/app/globals.css` — **there is no `tailwind.config.js`**) · lucide-react icons · Inter via `next/font`.

## Run it

```bash
npm run dev        # http://localhost:3000
npx tsc --noEmit   # type-check (keep green)
npm run lint
npm test           # Vitest suite (keep green) · npm run test:watch while developing
```

## Testing

Vitest + React Testing Library + jsdom. Config in `vitest.config.mts`; global setup in `src/test/setup.tsx` (mocks `next/image` and `next/navigation` — tests control routing via the exported `nav` object); all tests live in `src/__tests__/` (kept out of `src/app/` so Next never sees them).

Conventions:
- Test **behavior through roles/labels**, not markup — if a query needs `querySelector`, the component probably needs an aria-label instead (that rule already caught a real bug: the edit-event dialog was announced as "New event").
- Every screen's spec **acceptance criteria** are the test names; safety rules are non-negotiable tests: email never sends without the explicit confirm, permanent deletes require a confirm step, event cancellation warns about attendees, search returns honest not-found instead of fabricating, timezones always visible.
- `src/__tests__/lib.test.ts` guards the **mock↔API contract** (unique prefixed ids, recurring reminders carry `recurrence_human`, etc.) — keep it in sync when touching `mock.ts`.
- Mock async latencies (search 700ms, drafts/chat 900ms) use real timers — use `findBy*` with `{ timeout: 2500+ }`, don't add fake-timer plumbing.
- Components using React 19 `use(params)` must render inside an awaited `act()` with a `Suspense` wrapper (see `lists-pages.test.tsx`).

- The one gap worth naming honestly: these are jsdom component tests, not real-browser E2E; when the backend exists, a thin Playwright smoke layer over the critical journey (register → onboard → create reminder → receive on WhatsApp) would be the right addition.

## Layout of the code

```
src/app/(marketing)/        # public site: layout (header/footer) + landing page
src/app/app/                # authenticated app: layout.tsx = sidebar shell (client)
src/app/app/<screen>/page.tsx
src/components/ui/          # primitives: Button, Card, Chip (extend here, spec §8)
src/components/marketing/   # CtaPair, WhatsAppMockup, FaqAccordion
src/components/logo.tsx     # brand lockup (mark + wordmark)
src/lib/mock.ts             # ALL mock data + types — see "Mock data" below
src/lib/site.ts             # WhatsApp bot link (NEXT_PUBLIC_WA_BOT_NUMBER)
src/lib/cn.ts               # class joiner
public/brand/               # brand SVGs (mark.svg = cropped app icon)
```

## Rules that keep this codebase consistent

1. **Brand tokens only.** Never hardcode colors — use the Tailwind tokens from `globals.css` (`indigo-900`, `navy`, `cyan-500`, `violet-500`, `soft`, `ink-muted`, `line`, `success/warning/danger`). Radii: cards `rounded-[16px]` (Card component), controls `rounded-[10px]`.
2. **Mock data mirrors the API.** There is no backend yet. All screen data comes from `src/lib/mock.ts`, whose types copy the resource shapes in `AMIVA-BACKEND-SPEC.md` §5 field-for-field. When adding a screen, add its fixture there in the API's shape — never invent screen-local shapes. When the backend lands, `mock.ts` is replaced by a generated OpenAPI client and screens should barely change.
3. **Follow the spec's screen contract.** Each screen in `AMIVA-FRONTEND-SPEC.md` §6 lists its layout, states (loading/empty/error) and acceptance criteria. Empty states are required, not optional.
4. **Timezone display:** absolute times always show the tz abbreviation ("10:00 AM WAT"). Helpers `fmtTime`/`fmtDay` in `mock.ts`.
5. **Accessibility:** WCAG 2.1 AA. Interactive elements need labels; keyboard focus must be visible (global cyan focus ring already set); use `aria-selected` on tabs, `aria-live` for async feedback.
6. **Voice:** calm, human, sentence case. Amiva speaks in first person. Errors never blame the user.

## Status (update this table as you go)

| Area | State |
|---|---|
| Design tokens, fonts, brand assets | ✅ done |
| Marketing landing page (`/`) | ✅ done (single-page: features/pricing/FAQ as sections) |
| Legal pages `/privacy-policy`, `/terms` | ✅ built — content is **Draft v0.1, needs legal review** before verification submissions |
| App shell (sidebar, top bar) | ✅ done |
| Today (`/app/today`) | ✅ done (mock) |
| Reminders (`/app/reminders`) | ✅ done (mock) — create + edit modal (recurrence builder; unchanged RRULEs preserved verbatim), pause/delete menu |
| Tasks (`/app/tasks`) | ✅ done (mock) — categories (lists replacement), editable drawer |
| Lists | 🗑 removed (28 Jul review) — migrated into Tasks categories + subtasks |
| Chat (`/app/chat`) | ✅ done (mock echo assistant) |
| Calendar (`/app/calendar`) | ✅ done (mock) — Day/Week/Agenda views, event view modal + cancel confirm, create/edit modal with overlap warning |
| Memories (`/app/memories`) | ✅ done (mock) — search, filters, favorites, new-memory modal, inline edit, permanent-delete confirm |
| Search overlay (⌘K + top bar) | ✅ done (mock canned answers with citations; Email source disabled until Gmail) |
| Email (`/app/email`) | ✅ done (mock) — connect state shared with Settings, working range filter, suggested actions create real tasks/events, AI draft + approval-gated send |
| Settings (`/app/settings`) | ✅ done (mock) — Profile (verified badges + phone OTP), Features toggles, verification-gated Notifications matrix, Integrations, Security stubs, Activity tab (moved from sidebar), Privacy. Tone removed |
| Confirmation tray + notifications panel (top bar) | ✅ done — shared store, badges sync across Today/Chat/tray |
| Auth guard + sign out | ✅ done (mock localStorage session) |
| Dark mode (app shell) | ✅ done — token remap, Settings → Appearance |
| Toasts, focus-trapped modals, snooze/skip, reschedule slots, list/memory/task editing | ✅ done (fix-all pass, 28 Jul 2026) |
| Auth (`/login`, `/register`, `/complete-profile`, `/forgot-password`, `/link`) | ✅ done (mock) — Google sign-in, email-or-phone login, inline email OTP at signup (`/verify` removed), password toggles |
| Onboarding wizard (`/onboarding`, 6 steps incl. skippable phone verify) | ✅ done (mock) — skip-all, back button, animated brand panel |
| Test suite (Vitest + RTL, 16 files / 120 tests) | ✅ green — see Testing section |
| Real API client, TanStack Query, SSE | ❌ blocked on backend |

## Architecture notes (post fix-all pass, 28 Jul 2026)

- **Shared state**: `src/lib/store.ts` (tiny `useSyncExternalStore` wrapper) + `src/lib/stores.ts` (reminders, tasks, lists, memories, events, confirmations, notifications, settings). State survives client-side navigation and syncs across surfaces (top-bar badges ↔ Today banner ↔ Chat cards ↔ tray). In-memory only; a reload reseeds. Tests call `resetAllStores()` between cases (wired in setup).
- **Dialogs**: every dialog/drawer renders through `src/components/ui/modal.tsx` (backdrop, Escape, focus trap, focus restore). Its focus/keyboard effect is deliberately mount-only with an `onCloseRef` — re-running it per render yanks focus mid-typing and a space then "clicks" the Close button. Don't add `onClose` to its dep array.
- **Toasts**: `toast()` from `src/components/ui/toast.tsx`; `<Toaster/>` lives in the root layout. Supports an action (used for undo on task completion).
- **Mock auth**: `src/lib/session.ts` localStorage flag. The app layout redirects to /login without it; login/verify/link/onboarding set it; sidebar has sign-out. Replace with real tokens when the backend lands.
- **Dark mode**: `.theme-dark` on the app root remaps the brand tokens in globals.css (no per-component dark: variants). Controlled from Settings → Appearance (system/light/dark; system follows `prefers-color-scheme`). Marketing pages stay light by design. Never hardcode hex for themable ink — use tokens (`text-warning-ink`, not `text-[#9a6a1d]`).
- **Custom Select**: `components/ui/select.tsx` replaces every native `<select>`. Timezones from `lib/timezones.ts` (Intl-based, no endpoint). Phone inputs digits-only via `PhoneField`. Passwords via `PasswordField`.
- **Verified channels**: `settings.emailVerified/phoneVerified` gate reminder-modal channels and the notifications matrix; nothing sends to unverified media. All 28 Jul review amendments: frontend spec §10.
- **Local dates**: never key calendar days or task due-dates with `toISOString()` — it shifts a day for UTC+ users. Use the local `dayKey`/`localToday` helpers (bug found and fixed on 28 Jul).

## Known non-issues

- `npm run dev` logs 4 “Encountered two children with the same key” errors on every hard page load — including routes with no list rendering at all (e.g. `/login`). This comes from Turbopack’s injected dev scripts, not app code: client-side navigation logs zero, and the production build (`npm run build && npx next start`) is completely clean. Verified 26 Jul 2026; don’t chase it.

## Known intentional shortcuts

- Stores are in-memory: state persists across navigation but not across a full reload (the API layer replaces this).
- Settings' password/MFA buttons and per-device sign-out give honest "arrives with live accounts" toasts rather than fake flows.
- AI suggestions (subtasks, list items) and search answers are canned; drafts are template-generated.
- `launch.json` for Claude Code preview lives in the session workspace, not this repo; plain `npm run dev` works everywhere.

## Next steps (in order, from the spec's build order §9)

All spec screens are now built on mocks, including edit flows and the mobile nav drawer. Remaining:

1. Legal content sign-off by counsel (pages exist; remove the Draft banner after review).
2. Dark-mode pass (tokens exist in spec §2.1; components currently light-only) + full a11y audit (axe + manual).
3. When backend exists: replace `mock.ts` with generated client + TanStack Query, wire SSE, real auth guard on `/app/*`.
4. Then: the backend itself (`../AMIVA-BACKEND-SPEC.md`, build order §10).
