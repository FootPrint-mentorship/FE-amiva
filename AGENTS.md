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
| `../BE-amiva/AMIVA-BACKEND-SPEC.md` | The API contract this frontend consumes: every endpoint, request/response shape, error codes. Mock data mirrors these shapes exactly. |
| `../BE-amiva/openapi.yaml` | **The machine-readable contract (73 paths, §11+§13-amended — generate the typed client from THIS).** The backend is complete (spec steps 1–13, the §11 amendments, voice-note/media pipeline + calendar-in-chat, **and §13: MFA removed from MVP, 10 Aug** — login always returns tokens, `/auth/mfa/*` endpoints gone, 168 tests); explore/test it live at `http://localhost:8000/docs` (`docker compose up` in BE-amiva; §11 auth recipe in its README). |
| `../Amiva Product Requirements Document (PRD) v1.0.pdf` | Product requirements (the why). |
| `../Amiva Brand Guideline.pdf` | Brand identity. Tokens already extracted into `src/app/globals.css`. |

## Stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS v4 (CSS-based config via `@theme` in `src/app/globals.css` — **there is no `tailwind.config.js`**) · lucide-react icons · Inter via `next/font`.

## Run it

```bash
npm run dev        # http://localhost:3000 — real-API mode by default (see below)
npx tsc --noEmit   # type-check (keep green)
npm run lint
npm test           # Vitest suite (keep green; tests always run in mock mode)
npm run test:e2e   # Playwright smoke (prod build, mock mode, port 3100)
npm run gen:api    # regenerate src/lib/api/schema.d.ts from ../BE-amiva/openapi.yaml
```

**Two modes** (`.env.local` / `.env.example`):
- **Real API (default):** needs the backend running — `docker compose up -d app worker` in `../BE-amiva/` (self-contained dev keys; API on :8000). Registration OTPs are logged by the server: `docker compose logs app | grep "code is"`.
- **Self-contained demo:** set `NEXT_PUBLIC_USE_MOCKS=1` — everything runs on the in-memory mock stores, no backend. This flag is a permanent product requirement, keep it working.

## Backend integration status (6 Aug 2026, evening — read before continuing)

Architecture: `src/lib/api/client.ts` (fetch wrapper; access token in memory, refresh token in localStorage, single-flight refresh because tokens rotate — parallel refreshes revoke the session family) + repositories in `src/lib/data/` (`auth.ts`, `collections.ts`, `assistant.ts`, `search.ts`, `settings.ts`, `notifications.ts`): mock mode mutates stores, real mode calls the API then updates stores from the server response. Screens still render from the shared stores; `hydrateAll()` + `loadMe()` + `hydrateConfirmations()` + `hydrateNotifications()` run from the app layout once authed.

**Wired to the real API and verified in-browser:** registration with real inline email OTP (end-to-end), login (email-or-phone), sign-out, token refresh, hydration of reminders/tasks/memories/events, reminders full CRUD + snooze/skip/pause, tasks incl. subtask endpoints (`PATCH /tasks/{id}/subtasks/{sub_id}` — task PATCH does NOT accept subtasks), memories CRUD, calendar create/edit/cancel/reschedule, **chat/assistant** (server thread history, send, resource cards, in-thread confirmation cards; approve/reject from Chat, Today banner and the tray all hit `/assistant/confirmations/{id}/approve|reject` and re-hydrate collections), **search palette** (POST /search; API `source_type` is plural — mapped to singular kinds in `data/search.ts`), **Settings persistence** (PATCH /users/me, PATCH /users/me/features with revert-on-failure, GET/PUT notification prefs with display↔API key mapping, phone-verify OTP via `/auth/phone/*`), **notifications feed** (GET /notifications + POST /notifications/read).

**Resolved handoff items (6 Aug):** the /app/today crash ("Cannot read properties of undefined (reading 'filter')") was **not** the refresh race — `GET /calendar/events` returns a **bare array** per openapi.yaml, not the `{data,…}` list envelope, so `hydrateAll` was setting `eventsStore` to `undefined`. Fixed in `collections.ts`. The single-flight refresh itself was then verified explicitly: hard reload with only a refresh token → five 401s → exactly one `POST /auth/refresh` → all five retried 200. Test account (real backend): `grace.ede@example.com` / `Str0ng!Passw0rd` (the backend dev resets the DB sometimes — re-register if it 401s; email OTP is in `docker compose logs app | grep "code is"`).

Also fixed while wiring: Today/Calendar rendered the mock `user` (greeting said "Ada" for every real account) — they now read `settingsStore` (which absorbs email/phone too); tz abbreviations come from `timezoneAbbr()` in `lib/timezones.ts` (Intl plus a pinned map for African zones — Intl's `en` locale calls Lagos "GMT+1", the spec wants "WAT").

**Also wired (later on 6 Aug):** onboarding phone-verify step (same `/auth/phone/*` repo as Settings), **integrations** (`data/integrations.ts`: GET /integrations — another bare-array endpoint — hydrates real connect state incl. `whatsapp_linked` from /users/me; Connect posts `/integrations/google/authorize` and redirects to the returned `authorization_url`; Disconnect DELETEs the integration. Without GOOGLE_CLIENT_ID the backend answers PROVIDER_ERROR and the UI toasts honestly — never fakes connected). Also fixed: the reminder modal defaulted `channels` to `["whatsapp"]` even for phone-unverified users — now defaults to verified channels only (spec §10.2).

**Playwright smoke layer exists:** `npm run test:e2e` — `e2e/smoke.spec.ts` runs the critical journey (register with inline OTP → skip onboarding → Today → create reminder → sign out, plus the honest not-found search) against a production build in mock mode on :3100 (a second `next dev` in the same dir is refused, hence the prod build). `E2E_REAL=1 npx playwright test real-backend` additionally logs into the real backend on :3000 and creates a reminder through the chat assistant (verified end-to-end).

**Not yet wired:** Google sign-in (needs GOOGLE_CLIENT_ID; mock flow → /complete-profile). **SSE/cross-channel sync is blocked server-side** — the backend exposes no event-stream endpoint yet; when it lands, invalidate stores on events (spec §7). Note: the assistant needs **no LLM key** — the backend's rule-based fallback parser serves `POST /assistant/messages` in dev, incl. reminders/tasks/memories and calendar agenda/availability/create/reschedule/cancel with the high-risk confirm flow.

## Testing

Vitest + React Testing Library + jsdom. Config in `vitest.config.mts`; global setup in `src/test/setup.tsx` (mocks `next/image` and `next/navigation` — tests control routing via the exported `nav` object); all tests live in `src/__tests__/` (kept out of `src/app/` so Next never sees them).

Conventions:
- Test **behavior through roles/labels**, not markup — if a query needs `querySelector`, the component probably needs an aria-label instead (that rule already caught a real bug: the edit-event dialog was announced as "New event").
- Every screen's spec **acceptance criteria** are the test names; safety rules are non-negotiable tests: email never sends without the explicit confirm, permanent deletes require a confirm step, event cancellation warns about attendees, search returns honest not-found instead of fabricating, timezones always visible.
- `src/__tests__/lib.test.ts` guards the **mock↔API contract** (unique prefixed ids, recurring reminders carry `recurrence_human`, etc.) — keep it in sync when touching `mock.ts`.
- Mock async latencies (search 700ms, drafts/chat 900ms) use real timers — use `findBy*` with `{ timeout: 2500+ }`, don't add fake-timer plumbing.
- Components using React 19 `use(params)` must render inside an awaited `act()` with a `Suspense` wrapper (see `lists-pages.test.tsx`).

- The Playwright smoke layer now covers the real-browser gap: `npm run test:e2e` (mock mode, prod build on :3100) plus the opt-in `E2E_REAL=1 npx playwright test real-backend` journey against the live stack. WhatsApp delivery itself still can't be asserted from a browser.

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
2. **Mock data mirrors the API.** All screen data still comes from `src/lib/mock.ts`, whose types copy the resource shapes in `AMIVA-BACKEND-SPEC.md` §5 field-for-field. **The backend now exists and is integration-ready** — the real contract is `../BE-amiva/openapi.yaml`; integration = replacing `mock.ts` with a client generated from it (`openapi-typescript`/`orval`) + TanStack Query. Screens should barely change. Integration gotchas the backend README documents: 15-min access tokens (use `/auth/refresh`), `{data, next_cursor, total_estimate}` list envelope, `{error: {code, message, details}}` error shape, optional `Idempotency-Key` on POSTs, 120 req/min rate limit. **§11 amendments are now implemented server-side (6 Aug 2026)** — Google sign-in (`POST /auth/google` + `/auth/complete-profile`), inline email verification (register returns tokens), `identifier` login, `/meta/timezones`, tasks with `category` + subtask checklists (no `/lists/*`), `PATCH /users/me/features`, no `ai_tone`. Regenerate the client from the updated `openapi.yaml` (73 paths — §13 removed the MFA endpoints, 10 Aug) — integration can start against the final contract.
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
| API client + repositories (`lib/api`, `lib/data`) with NEXT_PUBLIC_USE_MOCKS escape hatch | ✅ wired & verified — auth, reminders/tasks/memories/calendar, chat/assistant + confirmations, search, settings persistence, phone OTP (Settings + onboarding), notifications feed, integrations; see "Backend integration status" |
| Playwright smoke layer (`npm run test:e2e`, optional `E2E_REAL=1` spec) | ✅ passing — see "Backend integration status" |
| Google sign-in (needs GOOGLE_CLIENT_ID) · SSE (no backend endpoint yet) | ❌ blocked externally (details above) |

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
