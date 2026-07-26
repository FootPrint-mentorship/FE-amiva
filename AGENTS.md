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
| `../AMIVA-BACKEND-SPEC.md` | The API contract this frontend consumes: every endpoint, request/response shape, error codes. Mock data mirrors these shapes exactly. |
| `../Amiva Product Requirements Document (PRD) v1.0.pdf` | Product requirements (the why). |
| `../Amiva Brand Guideline.pdf` | Brand identity. Tokens already extracted into `src/app/globals.css`. |

## Stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript strict · Tailwind CSS v4 (CSS-based config via `@theme` in `src/app/globals.css` — **there is no `tailwind.config.js`**) · lucide-react icons · Inter via `next/font`.

## Run it

```bash
npm run dev        # http://localhost:3000
npx tsc --noEmit   # type-check (keep green)
npm run lint
```

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
| Tasks (`/app/tasks`) | ✅ done (mock) — detail drawer included |
| Lists (`/app/lists`, `/app/lists/[id]`) | ✅ done (mock) |
| Chat (`/app/chat`) | ✅ done (mock echo assistant) |
| Calendar (`/app/calendar`) | ✅ done (mock) — Day/Week/Agenda views, event view modal + cancel confirm, create/edit modal with overlap warning |
| Memories (`/app/memories`) | ✅ done (mock) — search, filters, favorites, new-memory modal, inline edit, permanent-delete confirm |
| Search overlay (⌘K + top bar) | ✅ done (mock canned answers with citations; Email source disabled until Gmail) |
| Email (`/app/email`) | ✅ done (mock) — connect state, summary index, thread view, AI draft + approval-gated send |
| Activity (`/app/activity`) | ✅ done (mock) — filters, risk chips, expandable approval details |
| Settings (`/app/settings`) | ✅ done (mock) — Profile, Notifications matrix + quiet hours, Integrations, Security, Privacy/danger zone |
| Auth (`/login`, `/register`, `/verify`, `/forgot-password`, `/link`) | ✅ done (mock submits — no real API) |
| Onboarding wizard (`/onboarding`, 5 steps) | ✅ done (mock; Google connect buttons simulate) |
| Real API client, TanStack Query, SSE | ❌ blocked on backend |

## Known non-issues

- `npm run dev` logs 4 “Encountered two children with the same key” errors on every hard page load — including routes with no list rendering at all (e.g. `/login`). This comes from Turbopack’s injected dev scripts, not app code: client-side navigation logs zero, and the production build (`npm run build && npx next start`) is completely clean. Verified 26 Jul 2026; don’t chase it.

## Known intentional shortcuts

- Interactions are optimistic-only: state changes live in component `useState`, nothing persists across navigation.
- The confirmations bell and notifications bell in the top bar are display-only.
- `launch.json` for Claude Code preview lives in the session workspace, not this repo; plain `npm run dev` works everywhere.

## Next steps (in order, from the spec's build order §9)

All spec screens are now built on mocks, including edit flows and the mobile nav drawer. Remaining:

1. Legal content sign-off by counsel (pages exist; remove the Draft banner after review).
2. Dark-mode pass (tokens exist in spec §2.1; components currently light-only) + full a11y audit (axe + manual).
3. When backend exists: replace `mock.ts` with generated client + TanStack Query, wire SSE, real auth guard on `/app/*`.
4. Then: the backend itself (`../AMIVA-BACKEND-SPEC.md`, build order §10).
