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
npm test           # Vitest suite (keep green; tests run on the fake api() boundary in src/test/)
npm run test:e2e   # Playwright e2e (prod build on :3100 against the REAL local backend)
npm run gen:api    # regenerate src/lib/api/schema.d.ts from ../BE-amiva/openapi.yaml
```

**One mode** (17 Aug 2026 — mock mode fully retired at the client's direction; the real API is the only data source): the app needs the backend running — `docker compose up -d app worker` in `../BE-amiva/` (self-contained dev keys; API on :8000). Registration OTPs are logged by the server: `docker compose logs app | grep "code is"`. Types live in `src/lib/types.ts`, date display helpers in `src/lib/format.ts` (both split out of the deleted `mock.ts`). Tests do NOT need the backend: `src/test/fake-api.ts` fakes the `api()` boundary with the old seed data as fixtures, so components exercise the real repository code paths.

> **Session note (19 Aug 2026, prod QA fixes — STAGED uncommitted):** two register-page bugs found while running the QA workbook against production. (1) **The OTP boxes dropped every digit after the first** when a code arrived in a single input event — `maxLength={1}` truncated it, so SMS/email autofill and fast typing both produced a one-digit code. `OtpInput` now uses `maxLength={6}` + `autoComplete="one-time-code"` on box 1 and distributes a multi-digit event across the boxes (`fillFrom`); a retype on a filled box still replaces instead of shifting the code along (the "old+new" event is de-duped). Paste behaviour unchanged. (2) **A successful verify left the earlier "Code is invalid or has expired" error on screen**, directly above the green "Email verified" line — `confirmEmailCode` now clears `errors.email` on success. Phone-OTP flows (onboarding + settings) use transient toasts, so they never had bug 2. `src/test/fake-api.ts` gained `WRONG_CODE = "111111"` (it accepted ANY six digits before, so the mismatch path was untestable). 4 new tests; tsc + 135 vitest green; both browser-verified end-to-end against the local backend (wrong code → error → correct code → verified with the error gone).
>
> **Session note (19 Aug 2026) — recurring events, STAGED uncommitted:** the calendar create/edit modal now has a full Repeat section (`Does not repeat / Every day / week / month / year / Custom…`; weekday chips for weekly, `Every N unit` for custom, Ends = Never / On date / After N occurrences) built on new pure helpers in `src/lib/recurrence.ts` (`buildEventRrule` / `parseEventRrule` / `describeRecurrence` — unit-tested; same FE-builds-RRULE-string architecture as the reminder modal, server validates + humanizes). `CalendarEvent` gained optional `rrule` / `recurrence_human` / `recurring_event_id`. Google expands a series into instance rows: editing an instance hides the recurrence controls ("applies to this occurrence only" hint) and `saveEvent` omits `rrule` for instances (PATCHing an instance with rrule is a 422 — recurrence lives on the master). Cancelling a recurring event offers "This occurrence" vs "Whole series" (`cancelEvent(event, scope)` — signature changed); series cancel invalidates the events cache. Detail modal shows the server's `recurrence_human`. An untouched recurrence on edit keeps the original rule verbatim (builder can't reproduce every RFC shape). API types regenerated from the re-exported contract. tsc + 131 vitest green; live-verified the POST body (`rrule: "FREQ=WEEKLY;BYDAY=MO,WE"`, timezone Africa/Lagos) against the local backend.

## Backend integration status (6 Aug 2026, evening — read before continuing)

Architecture: `src/lib/api/client.ts` (fetch wrapper; access token in memory, refresh token in localStorage, single-flight refresh because tokens rotate — parallel refreshes revoke the session family) + repositories in `src/lib/data/` (`auth.ts`, `collections.ts`, `assistant.ts`, `search.ts`, `settings.ts`, `notifications.ts`, `activity.ts`): every call goes to the API and the caches update from the server response. Screens render from the query cache / settings store; `hydrateAll()` + `loadMe()` + `hydrateConfirmations()` + `hydrateNotifications()` run from the app layout once authed.

**Wired to the real API and verified in-browser:** registration with real inline email OTP (end-to-end), login (email-or-phone), sign-out, token refresh, hydration of reminders/tasks/memories/events, reminders full CRUD + snooze/skip/pause, tasks incl. subtask endpoints (`PATCH /tasks/{id}/subtasks/{sub_id}` — task PATCH does NOT accept subtasks), memories CRUD, calendar create/edit/cancel/reschedule, **chat/assistant** (server thread history, send, resource cards, in-thread confirmation cards; approve/reject from Chat, Today banner and the tray all hit `/assistant/confirmations/{id}/approve|reject` and re-hydrate collections), **search palette** (POST /search; API `source_type` is plural — mapped to singular kinds in `data/search.ts`), **Settings persistence** (PATCH /users/me, PATCH /users/me/features with revert-on-failure, GET/PUT notification prefs with display↔API key mapping, phone-verify OTP via `/auth/phone/*`), **notifications feed** (GET /notifications + POST /notifications/read), **Settings Security tab** (real GET /auth/sessions list with current-device flag + DELETE remote revoke; "Change password" sends the real §11.4 reset link via /auth/password/forgot; MFA button removed — MFA left the MVP), **Settings Privacy tab** (`data/privacy.ts`: live GET /privacy/overview counts — key is `data_categories`; export = POST /privacy/export → poll → authed blob download via `apiBlob()` in client.ts, a plain href can't fetch it; DELETE /account behind a confirm modal → toast + sign-out), **sign-out confirm modal** (both layout sign-out buttons).

**Resolved handoff items (6 Aug):** the /app/today crash ("Cannot read properties of undefined (reading 'filter')") was **not** the refresh race — `GET /calendar/events` returns a **bare array** per openapi.yaml, not the `{data,…}` list envelope, so `hydrateAll` was setting `eventsStore` to `undefined`. Fixed in `collections.ts`. The single-flight refresh itself was then verified explicitly: hard reload with only a refresh token → five 401s → exactly one `POST /auth/refresh` → all five retried 200. Test account (real backend): `grace.ede@example.com` / `Str0ng!Passw0rd` (the backend dev resets the DB sometimes — re-register if it 401s; email OTP is in `docker compose logs app | grep "code is"`).

Also fixed while wiring: Today/Calendar rendered the mock `user` (greeting said "Ada" for every real account) — they now read `settingsStore` (which absorbs email/phone too); tz abbreviations come from `timezoneAbbr()` in `lib/timezones.ts` (Intl plus a pinned map for African zones — Intl's `en` locale calls Lagos "GMT+1", the spec wants "WAT").

**Also wired (later on 6 Aug):** onboarding phone-verify step (same `/auth/phone/*` repo as Settings), **integrations** (`data/integrations.ts`: GET /integrations — another bare-array endpoint — hydrates real connect state incl. `whatsapp_linked` from /users/me; Connect posts `/integrations/google/authorize` and redirects to the returned `authorization_url`; Disconnect DELETEs the integration. Without GOOGLE_CLIENT_ID the backend answers PROVIDER_ERROR and the UI toasts honestly — never fakes connected). Also fixed: the reminder modal defaulted `channels` to `["whatsapp"]` even for phone-unverified users — now defaults to verified channels only (spec §10.2).

**Playwright layer:** `npm run test:e2e` — `e2e/journey.spec.ts` (rewritten 17 Aug when mock mode retired) runs the critical journeys against a production build on :3100 talking to the REAL local backend: register with the real emailed OTP (read from the backend dev log via docker compose), skip onboarding, create a reminder (tz visible), sign out through the confirm modal; then login, chat-assistant reminder, honest not-found search.

**Also wired (13 Aug):** `/link` (WhatsApp deep-link landing) — was still the mock page with a hardcoded dummy number. Now: `data/linking.ts` calls the authed `POST /link/whatsapp/verify`; an unauthenticated visitor's token waits in localStorage (`amiva_pending_wa_link`) and the app layout completes the bind right after sign-in/registration (toast confirms). The page never shows a number — the token carries only a hash by design. Mock mode keeps the old demo path.

**Not yet wired:** Google sign-in (needs GOOGLE_CLIENT_ID; mock flow → /complete-profile). **SSE/cross-channel sync is blocked server-side** — the backend exposes no event-stream endpoint yet; when it lands, invalidate stores on events (spec §7). Note: the assistant needs **no LLM key** — the backend's rule-based fallback parser serves `POST /assistant/messages` in dev, incl. reminders/tasks/memories and calendar agenda/availability/create/reschedule/cancel with the high-risk confirm flow.

## Testing

Vitest + React Testing Library + jsdom. Config in `vitest.config.mts`; global setup in `src/test/setup.tsx` (mocks `next/image` and `next/navigation` — tests control routing via the exported `nav` object); all tests live in `src/__tests__/` (kept out of `src/app/` so Next never sees them).

Conventions:
- Test **behavior through roles/labels**, not markup — if a query needs `querySelector`, the component probably needs an aria-label instead (that rule already caught a real bug: the edit-event dialog was announced as "New event").
- Every screen's spec **acceptance criteria** are the test names; safety rules are non-negotiable tests: permanent deletes require a confirm step, event cancellation warns about attendees, search returns honest not-found instead of fabricating, timezones always visible.
- Tests run against `src/test/fake-api.ts` (vi.mock of `@/lib/api/client` in setup) — components exercise the REAL repository code; the fake serves the old seed data from `src/test/fixtures.ts` and mirrors the API contract (list envelope, bare-array calendar, SubtaskOut responses). Keep the fake honest to `openapi.yaml` when the contract changes.
- Data now arrives via query fetch microtasks — prefer `await findBy*` over `getBy*` for anything rendered from a collection.
- Components using React 19 `use(params)` must render inside an awaited `act()` with a `Suspense` wrapper (see `lists-pages.test.tsx`).

- The Playwright layer (`npm run test:e2e`, `e2e/journey.spec.ts`) runs a prod build on :3100 against the REAL local backend (`docker compose up -d app worker` first): register with the real emailed OTP (read from the backend dev log) → today → reminder → sign-out confirm, then login → chat-assistant reminder → honest search. WhatsApp delivery itself still can't be asserted from a browser.

## Layout of the code

```
src/app/(marketing)/        # public site: layout (header/footer) + landing page
src/app/app/                # authenticated app: layout.tsx = sidebar shell (client)
src/app/app/<screen>/page.tsx
src/components/ui/          # primitives: Button, Card, Chip (extend here, spec §8)
src/components/marketing/   # CtaPair, WhatsAppMockup, FaqAccordion
src/components/logo.tsx     # brand lockup (mark + wordmark)
src/lib/types.ts            # API resource types (contract §5 / openapi.yaml)
src/lib/format.ts           # fmtTime/fmtDay display helpers
src/lib/data/               # repositories — the only code calling api()
src/test/fake-api.ts        # test-only fake of the api() boundary + fixtures
src/lib/site.ts             # WhatsApp bot link (NEXT_PUBLIC_WA_BOT_NUMBER)
src/lib/cn.ts               # class joiner
public/brand/               # brand SVGs (mark.svg = cropped app icon)
```

## Rules that keep this codebase consistent

1. **Brand tokens only.** Never hardcode colors — use the Tailwind tokens from `globals.css` (`indigo-900`, `navy`, `cyan-500`, `violet-500`, `soft`, `ink-muted`, `line`, `success/warning/danger`). Radii: cards `rounded-[16px]` (Card component), controls `rounded-[10px]`.
2. **The API contract is the source of truth.** Types in `src/lib/types.ts` copy the resource shapes in `../BE-amiva/openapi.yaml` field-for-field; repositories in `src/lib/data/` are the only code that calls `api()`. Contract gotchas: 15-min access tokens (use `/auth/refresh`), `{data, next_cursor, total_estimate}` list envelope (but GET /calendar/events and GET /integrations return bare arrays), `{error: {code, message, details}}` error shape, subtask endpoints return the SubtaskOut object not the parent task, optional `Idempotency-Key` on POSTs, 120 req/min rate limit. Regenerate `schema.d.ts` after contract changes (`npm run gen:api`).
3. **Follow the spec's screen contract.** Each screen in `AMIVA-FRONTEND-SPEC.md` §6 lists its layout, states (loading/empty/error) and acceptance criteria. Empty states are required, not optional.
4. **Timezone display:** absolute times always show the tz abbreviation ("10:00 AM WAT"). Helpers `fmtTime`/`fmtDay` in `lib/format.ts`; `timezoneAbbr()` in `lib/timezones.ts`.
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
| Search overlay (⌘K + top bar) | ✅ done (mock canned answers with citations; sources: Memories/Calendar/Tasks) |
| Email (`/app/email`) | ❌ REMOVED FROM PRODUCT 13 Aug 2026 (client decision; backend spec §15, contract now 67 paths) — screen, nav item, feature flag, Gmail integration/onboarding step, Email search source, mock threads all deleted. Google sign-in + Calendar unaffected; "Email" stays only as a notification delivery channel + auth email verification |
| Settings (`/app/settings`) | ✅ done & integrated — Profile (verified badges + phone OTP), Features toggles, verification-gated Notifications matrix, Integrations, Security (real sessions + revoke, reset-link password change), Activity tab (moved from sidebar), Privacy (live counts, working export + account deletion). Tone removed; MFA removed with the MVP descope |
| Confirmation tray + notifications panel (top bar) | ✅ done — shared store, badges sync across Today/Chat/tray |
| Auth guard + sign out | ✅ done (mock localStorage session) |
| Dark mode (app shell) | ✅ done — token remap, Settings → Appearance |
| Toasts, focus-trapped modals, snooze/skip, reschedule slots, list/memory/task editing | ✅ done (fix-all pass, 28 Jul 2026) |
| Auth (`/login`, `/register`, `/complete-profile`, `/forgot-password`, `/link`) | ✅ done (mock) — Google sign-in, email-or-phone login, inline email OTP at signup (`/verify` removed), password toggles |
| Onboarding wizard (`/onboarding`, 6 steps incl. skippable phone verify) | ✅ done (mock) — skip-all, back button, animated brand panel |
| Test suite (Vitest + RTL, 16 files / 120 tests) | ✅ green — see Testing section |
| API client + repositories (`lib/api`, `lib/data`) with NEXT_PUBLIC_USE_MOCKS escape hatch | ✅ wired & verified — auth, reminders/tasks/memories/calendar, chat/assistant + confirmations, search, settings persistence, phone OTP (Settings + onboarding), notifications feed, integrations; see "Backend integration status" |
| Server-state cache → **TanStack Query** (16 Aug 2026) | ✅ migrated & verified in-browser against the real backend — see Architecture notes; subtask endpoint contract fixed, real suggest-subtasks wired (needs LLM key server-side), task-drawer UX fixes (blur-commit inputs, optimistic subtask toggle, manual add-subtask) |
| Playwright smoke layer (`npm run test:e2e`, optional `E2E_REAL=1` spec) | ✅ passing — see "Backend integration status" |
| Google sign-in (needs GOOGLE_CLIENT_ID) · SSE (no backend endpoint yet) | ❌ blocked externally (details above) |

## Architecture notes (post fix-all pass, 28 Jul 2026; TanStack Query migration, 16 Aug 2026)

- **Server state = TanStack Query** (migrated 16 Aug 2026): all server-owned collections (reminders, tasks, memories, events, confirmations, notifications, integrations) live in the query cache. One singleton `queryClient` in `src/lib/query.ts`, passed to `useQuery` explicitly so hooks work in tests without provider plumbing. Screens read via `useReminders()/useTasks()/useMemories()/useEvents()` (lib/data/collections.ts), `useConfirmations()` (assistant.ts), `useNotifications()` (notifications.ts), `useIntegrations()` (integrations.ts) — each returns `{items, loading}`. Repositories keep their function signatures; mutations hit the API then write the server response into the cache via the `upsertInList/patchInList/removeFromList/setList` helpers. staleTime 30s, refetch-on-focus for free background freshness; `invalidateCollections()` replaces the old "re-hydrate after assistant actions" (`hydrateAll` remains as the app-layout warm-up via `fetchQuery` so a dead backend still rejects into the error toast). Cross-surface sync (top-bar badges ↔ Today banner ↔ Chat cards ↔ tray) now rides the shared cache.
- **Client state stays in `src/lib/store.ts`** (tiny `useSyncExternalStore` wrapper): toasts and the settings singleton (`stores.ts` — profile mirror + theme + the Settings screen's form state; written by `absorbUser`/`loadMe` from auth flows). It is deliberately NOT a query: it's form/UI state with a server mirror, not a server cache. Tests call `resetAllStores()` AND `queryClient.clear()` between cases (both wired in setup — note the dynamic import there: `NEXT_PUBLIC_USE_MOCKS` must be set before `lib/api/client.ts` loads).
- **Subtask contract** (16 Aug 2026, found live): `POST /tasks/{id}/subtasks` and `PATCH /tasks/{id}/subtasks/{sub_id}` return the **SubtaskOut object, not the parent task** — the old code upserted the response as a Task and silently corrupted the store (suggestions "never appeared"). `addSubtasks` appends each created subtask into the cached task as it lands; `toggleSubtask` is optimistic (instant flip, server reconcile, rollback on failure). `suggestSubtaskIdeas()` calls `POST /tasks/{id}/suggest-subtasks`; without an LLM key the backend answers 502 PROVIDER_ERROR — surfaced as an honest "AI suggestions aren't available" toast, and the drawer now has a manual "Add a subtask" input so the flow never dead-ends. Task drawer text inputs (Project, due date) are uncontrolled and commit on blur/Enter — saving per keystroke raced the server echo and garbled typing.
- **Dialogs**: every dialog/drawer renders through `src/components/ui/modal.tsx` (backdrop, Escape, focus trap, focus restore). Its focus/keyboard effect is deliberately mount-only with an `onCloseRef` — re-running it per render yanks focus mid-typing and a space then "clicks" the Close button. Don't add `onClose` to its dep array.
- **Toasts**: `toast()` from `src/components/ui/toast.tsx`; `<Toaster/>` lives in the root layout. Supports an action (used for undo on task completion).
- **Mock auth**: `src/lib/session.ts` localStorage flag. The app layout redirects to /login without it; login/verify/link/onboarding set it; sidebar has sign-out. Replace with real tokens when the backend lands.
- **Dark mode**: `.theme-dark` on the app root remaps the brand tokens in globals.css (no per-component dark: variants). Controlled from Settings → Appearance (system/light/dark; system follows `prefers-color-scheme`). Marketing pages stay light by design. Never hardcode hex for themable ink — use tokens (`text-warning-ink`, not `text-[#9a6a1d]`).
- **Custom Select**: `components/ui/select.tsx` replaces every native `<select>`. Timezones from `lib/timezones.ts` (Intl-based, no endpoint). Phone inputs digits-only via `PhoneField`. Passwords via `PasswordField`.
- **Verified channels**: `settings.emailVerified/phoneVerified` gate reminder-modal channels and the notifications matrix; nothing sends to unverified media. All 28 Jul review amendments: frontend spec §10.
- **Local dates**: never key calendar days or task due-dates with `toISOString()` — it shifts a day for UTC+ users. Use the local `dayKey`/`localToday` helpers (bug found and fixed on 28 Jul).

## Known non-issues

- `npm run dev` logs 4 “Encountered two children with the same key” errors on every hard page load — including routes with no list rendering at all (e.g. `/login`). This comes from Turbopack’s injected dev scripts, not app code: client-side navigation logs zero, and the production build (`npm run build && npx next start`) is completely clean. Verified 26 Jul 2026; don’t chase it.
- Lint is fully clean as of 17 Aug 2026 (0 errors, 0 warnings): unused-var rule ignores `^_` (the drop-a-key destructure idiom), the test double for `next/image` carries a scoped eslint-disable, and `ui/select.tsx` gained the missing `aria-controls` wiring (trigger ↔ listbox via `useId`). Keep it clean.
- Chat auto-scroll sets `scrollTop` directly (16 Aug) — queued smooth `scrollIntoView` animations cancel each other when optimistic message → typing → reply land in quick succession, stranding the reply off-screen. The thread container also carries `pr-3` so the overlay scrollbar never covers text.
- Resolved confirmations stay in the query cache on refetch (16 Aug, `data/assistant.ts`): the pending-only endpoint would otherwise drop a just-approved item and Chat's in-thread card would re-arm its buttons on window refocus.

## Known intentional shortcuts

- The query cache is in-memory: state persists across navigation but not across a full reload (it refetches from the server).
- Settings Security/Privacy are fully wired (13 Aug): real sessions with remote revoke, reset-link password change, live data counts, export download, account deletion. Gotcha: the Celery worker does NOT hot-reload — after backend schema/code changes, `docker compose up -d worker beat` (restart alone doesn't re-read .env) or export jobs run stale code.
- 16 Aug (Google + phone batch, staged on `amiva-develop`): REAL Google sign-in wired — `lib/google.ts` redirects to Google when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set (mock fallback otherwise); `/google-callback` page (branded ring loader) exchanges the code via POST /auth/google. Needs on Netlify: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` + `NEXT_PUBLIC_API_BASE_URL=https://api.tryamiva.com/api/v1`; console redirect URIs: `https://tryamiva.com/google-callback`, `http://localhost:3000/google-callback`, `https://api.tryamiva.com/api/v1/integrations/google/callback`. Complete-profile now calls the real endpoint (was a setTimeout mock) and phone is OPTIONAL there and on register (§11.1 amended). Settings → Profile has Add/Change number → two-stage modal; the number only changes after OTP verify (§11.2 amended). `/users/me` finally returns `email_verified`/`phone_verified` (client regenerated). Required fields show a red asterisk via `RequiredMark` in ui/field.tsx — keep the mark OUTSIDE the `<label>` (inside breaks accessible names + getByLabelText). GoogleButton labels differ per page ("Sign in with Google"/"Sign up with Google"). Calendar create modal fixed (422: missing required `timezone`; attendees are plain email strings). Settings gates server-truth UI behind `settings.hydrated`. eslint `react-hooks/set-state-in-effect`: never setState in an effect body — use useSyncExternalStore for external state (marketing header session) or the deferred-setTimeout idiom (settings OAuth bounce-back).
- 13 Aug (PR #10 review batch): contact links → wa.me (real number is the `WA_BOT_NUMBER` fallback in `lib/site.ts`; `SUPPORT_EMAIL` lives there too and appears in FAQ/footer/settings), CtaPair invert white-on-white fixed (mutually exclusive class sets — cn() has no tailwind-merge), Logo reverted to mark+wordmark (the horizontal SVG export is a square 360×360 canvas — letterboxes; ask design for a cropped export), scroll-mt-20 on anchor sections, onboarding "first request" now calls the real assistant (was a hardcoded fake reply), search placeholder shortens to "Search" on mobile, marketing email-feature copy removed, WhatsApp channel gating keys on the LINK not phone verification (§11.5 amendment). Two dev-env gotchas: the backend test suite TRUNCATES the compose dev DB (local accounts vanish after every pytest run), and real SMTP creds in BE-amiva/.env make local dev send real email (now commented out).
- Subtask suggestions call `POST /tasks/{id}/suggest-subtasks` (16 Aug) — the backend needs an LLM key configured or it answers 502 PROVIDER_ERROR (honest toast, manual add always available).
- `launch.json` for Claude Code preview lives in the session workspace, not this repo; plain `npm run dev` works everywhere.

# Transactional emails — design handoff

Every email Amiva sends today, with the exact trigger, subject, and content
variables. Sender identity for all of them: **Amiva `<no-reply@tryamiva.com>`**
(Resend, domain verified). All bodies are currently plain text — when the
designs are ready, `app/channels/email_channel.py::send_email` grows an HTML
part (code change, small).

The Gmail/email *feature* was removed from the product (13 Aug 2026) — these
are auth/lifecycle emails only, and they are all that exists.

| # | Email | Trigger | Subject | Body copy today | Variables |
|---|---|---|---|---|---|
| 1 | **Email verification code** | Registration step 1 (`POST /auth/email/send-code`), re-sendable | `Your Amiva verification code` | "Your verification code is {code}. It expires in 10 minutes." | 6-digit `code` |
| 2 | **Password reset link** | "Forgot password" or Settings → Security → Change password (`POST /auth/password/forgot`) | `Reset your Amiva password` | "Use this link to reset your password (valid for 30 minutes): {link}" | `link` = `https://tryamiva.com/forgot-password?token=…` |
| 3 | **Account deletion scheduled** | Settings → Privacy → Delete my account (`DELETE /account`) | `Your Amiva account is scheduled for deletion` | "Your account was deactivated and will be permanently deleted on {date}. If this wasn't you, contact support immediately." | `date` (deletion date, 14-day grace) |
| 4 | **Notification email** (latent) | The §8.2 notification sender can deliver any in-app notification by email when a user's matrix enables the Email channel for a category (Reminders / Tasks / Daily agenda / Product updates). No feature produces these yet — reminders currently deliver via WhatsApp only. | dynamic: the notification `title` | the notification `body` | `title`, `body` |

Design notes for the designer:

- #1 is the highest-volume email and the first thing every new user sees.
- #2 and #3 are security-sensitive: the design should keep the action link
  obvious and include the "if this wasn't you" reassurance.
- #4 needs a generic "notification" template (title + body + CTA back to
  https://tryamiva.com) that any future category can reuse.
- One shared frame (logo, indigo `#20185B` / cyan `#57C7DC` brand palette,
  Inter, footer with support contact) + per-email content blocks is enough —
  four templates, one layout.
- Related but NOT email: the WhatsApp phone-verification message ("Your Amiva
  verification code is {code}. It expires in 10 minutes.") — same voice, no
  design needed.
