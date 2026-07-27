# Amiva Web — Complete Frontend Build Specification

> **Audience:** any engineer or AI coding agent. Self-contained per-screen specification for the Amiva frontend, which has two faces in one application: the **public marketing website** (§4) — the front door where users land, learn about Amiva and start using it — and the **web dashboard** (§5–§6) — the authenticated application. The frontend communicates with the backend exclusively through the REST API defined in `AMIVA-BACKEND-SPEC.md` (all endpoint references below point there). No business logic lives in the frontend.

---

## 1. Stack & Conventions

| Concern | Choice |
|---|---|
| Framework | Next.js 15+ (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS with the design tokens in §2 wired as the theme; CSS variables for light/dark |
| Rendering | Marketing routes: **static generation (SSG)** — fast, cacheable, SEO-indexed. App routes: client-rendered behind auth |
| Data | TanStack Query for all server state (queryKey per resource, invalidate on mutation); no server state in global stores. Zustand only for UI state (sidebar, modals) |
| API client | Generated from the backend's `openapi.yaml` (`openapi-typescript` + a thin fetch wrapper). **Never hand-write request/response types** |
| Auth | Access token in memory; refresh token in httpOnly Secure cookie (backend sets it); silent refresh on 401 then retry once; hard redirect to `/login` on refresh failure |
| Forms | react-hook-form + zod resolvers |
| Dates | All display in the **user's profile timezone** (`user.timezone`), via a single `formatInUserTz()` util. Always show tz abbreviation on absolute times ("10:00 AM WAT") |
| Realtime | SSE connection to `GET /api/v1/events/stream` (reminders/tasks/confirmations changed → invalidate queries). Fallback: 30 s refetch on window focus |
| Icons | Lucide |
| Accessibility | WCAG 2.1 AA (PRD requirement): full keyboard nav, visible focus rings (2px `--cyan`), `aria-live` for toasts/chat, ≥4.5:1 contrast, reduced-motion support |
| i18n | English at launch; wrap all strings in an i18n layer (`next-intl`) from day one |

**Repository:** `amiva-web/` — separate repo from the backend, own CI/CD, deployed to CDN/edge (e.g. Vercel). Env: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_WA_BOT_NUMBER` (E.164, for `wa.me` links).

**Domain strategy:** one domain (e.g. `amiva.example`). Marketing pages at the root (`/`, `/pricing`, …), auth at `/login`, `/register`, application under `/app/*`. One deployment, no subdomain juggling; the backend's `DASHBOARD_ORIGIN` points at this domain.

```
src/
├── app/
│   ├── (marketing)/            # §4 — public site, SSG, own header/footer
│   ├── (public)/               # §5.1–5.5 — auth screens, no shell
│   ├── (onboarding)/           # §5.6 — wizard shell
│   └── (app)/app/              # §6 — main shell, auth-guarded
├── components/ui/              # §8 primitives
├── components/domain/          # ReminderCard, EventCard, TaskRow, MemoryCard, ...
├── components/marketing/       # Hero, FeatureSection, PricingTable, FaqAccordion, ...
├── lib/api/                    # generated client + fetch wrapper + query keys
├── lib/hooks/                  # useUser, useConfirmations, useSse, ...
└── styles/tokens.css           # §2 as CSS variables
```

---

## 2. Design Tokens (from Amiva Brand Guideline)

### 2.1 Color

| Token | Hex | Usage |
|---|---|---|
| `--indigo` (Deep Indigo) | `#20185B` | Primary brand: primary buttons, active nav, links, headings accents |
| `--navy` (Dark Navy) | `#131628` | Body text (light mode); app background (dark mode) |
| `--cyan` (Bright Cyan) | `#57C7DC` | Accent: focus rings, highlights, AI/assistant identity, progress, selected states |
| `--violet` (Soft Violet) | `#615AA7` | Secondary: tags, secondary buttons, illustrations, hover tints |
| `--soft` (Soft White) | `#F4F5FB` | App background (light mode); card fill (dark mode text) |
| `--white` | `#FFFFFF` | Cards, surfaces (light mode) |
| Semantic | success `#2FA36B` · warning `#E5A13A` · danger `#D9534F` · info = `--cyan` | Derive 50–900 scales from each with Tailwind |

Derived scale for indigo (Tailwind `primary`): 50 `#EEEDF7` · 100 `#D9D6EE` · 300 `#918BC9` · 500 `#4A3FA0` · 700 `#2C2372` · 900 `#20185B`.

Dark mode (app only — the marketing site ships light-mode only at MVP): background `--navy`, surface `#1C2038`, borders `#2A2F4A`, body text `#E6E8F4`, primary actions shift to `--cyan` on dark surfaces for contrast.

### 2.2 Typography — **Inter** (brand typeface)

| Style | Spec |
|---|---|
| Marketing hero | Inter 700, 44–56/1.1 (clamp responsive) |
| Display / page title | Inter 600, 28/36 |
| Section heading | Inter 600, 20/28 |
| Card title | Inter 600, 16/24 |
| Body | Inter 400, 14/22 (marketing body: 16/26) |
| Small / meta | Inter 400, 12/18, `#6B6F80` |
| Numeric (times, counts) | Inter 500, tabular-nums |

### 2.3 Shape & spacing
Radius: cards 16px, buttons/inputs 10px, pills 999px. Spacing scale 4/8/12/16/24/32/48. Card shadow `0 1px 3px rgb(19 22 40 / 0.08)`. Max content width: app 1200px, marketing 1140px.

### 2.4 Voice (UX copy)
Calm, human, confident. Sentence case everywhere. The assistant speaks in first person ("I've set that reminder"). Never blame the user in errors; always offer the next step. Marketing copy: benefit-first, concrete, no AI hype ("Never forget a bill again" beats "Revolutionary AI assistant").

---

## 3. Application Shell & Navigation

**Route groups:** `(marketing)` → public site with its own light header/footer (§4.1). `(public)` → auth screens, centered card, no shell. `(onboarding)` → wizard shell (logo + progress). `(app)` → main shell, auth-guarded.

**Main app shell** (`/app/*`):
- **Sidebar** (240px, collapsible to 64px icon rail; overlay drawer <1024px): logo → nav: **Today · Chat · Reminders · Calendar · Tasks · Lists · Memories · Email · Activity** → bottom: Settings, user avatar menu (profile, privacy, sign out). Active item: indigo fill, white text, 8px radius.
- **Top bar:** global search input (⌘K opens Search overlay, §6.8), pending-confirmations bell with badge (`GET /assistant/confirmations?status=pending`), notifications bell (`GET /notifications?unread`).
- **Confirmation tray:** clicking the confirmations bell opens a right drawer listing pending confirmations, each with summary, risk chip, countdown to expiry, **Approve** / **Reject** buttons (backend spec §5.9). This surface is mandatory — high-risk WhatsApp actions can be approved here.
- **Toasts:** bottom-right, `aria-live=polite`, success/error/info variants, action link when relevant ("View task").

**Responsive:** desktop-first for the app, fully usable at 360px; marketing site is mobile-first. Tables collapse to card lists on mobile; primary actions become a floating action button.

---

## 4. Marketing Website (Public Site)

The front door. Users arriving from ads, social or word of mouth land here, understand Amiva in seconds, and either **start on WhatsApp** or **create an account** for the web app. It also hosts the legal pages that Meta business verification and Google OAuth verification both require — **the website must therefore ship before either verification can complete** (it is on the Phase 0 critical path, see §9).

### 4.0 Global rules for marketing pages
- **Performance budget (hard):** African mobile data is the target context. SSG only; ≤ 100 KB JS per page (no app bundle leakage — enforce with bundle analyzer in CI); images as responsive AVIF/WebP with explicit dimensions; self-hosted Inter (swap); LCP < 2.5 s on simulated 3G; Lighthouse ≥ 90 on all categories.
- **Header (marketing variant):** Amiva horizontal logo (links `/`) · nav: Features, Pricing, FAQ · right: **Log in** (ghost → `/login`), **Get started** (primary → `/register`). Sticky, blurs on scroll. Mobile: hamburger sheet.
- **Footer:** logo + one-liner · columns: Product (Features, Pricing, FAQ) · Company (Contact) · Legal (Privacy Policy, Terms of Service) · WhatsApp CTA button · © Amiva 2026 · language placeholder.
- **Primary CTAs** (identical pair, reused across pages):
  - **Start on WhatsApp** — `https://wa.me/{WA_BOT_NUMBER}?text=Hi%20Amiva` (opens the bot with a prefilled greeting; the bot handles onboarding + account linking from there, backend spec §3.1).
  - **Create free account** — `/register`.
- **SEO:** unique `<title>`/meta description per page; OpenGraph + Twitter cards (branded OG image template: indigo background, cyan accent, page title); `sitemap.xml`, `robots.txt`; JSON-LD (`Organization` sitewide, `FAQPage` on FAQ, `Product` + `Offer` on Pricing); canonical URLs.
- **Analytics:** lightweight, cookieless-by-default analytics; events: `cta_whatsapp_click`, `cta_register_click`, `pricing_view`, `faq_open`. Consent banner only if/when non-essential cookies are added.

### 4.1 Home (`/`)
- **Purpose:** communicate "manage your life and work from one conversation" and convert to WhatsApp or sign-up in one screenful.
- **Sections, in order:**
  1. **Hero** — headline "Your personal chief of staff, on WhatsApp." + subline (reminders, calendar, email, memory in one conversation). CTA pair (§4.0). Right: phone mockup showing a real conversation ("Remind me to pay rent on Friday" → Amiva's confirmation bubble) — build as styled DOM, not a screenshot, so copy stays editable and light. Trust line under CTAs: "Free to start · No app to install".
  2. **How it works** — 3 numbered cards: ① Say hello on WhatsApp ② Connect your calendar and email ③ Ask for anything — remind, schedule, remember. Each with a small illustration from brand assets.
  3. **Feature tour** — alternating text/visual rows, one per module: Reminders ("Set it in one sentence — get it on WhatsApp, email or both"), Calendar ("Schedules meetings, finds free slots, handles time zones"), Memory ("Tell Amiva once, find it forever"), Email ("Your inbox, summarised; replies drafted, sent only with your approval"), Tasks & Lists ("From voice note to organised to-do"). Each row ends with a micro-CTA "Try it on WhatsApp →".
  4. **Trust & privacy band** (indigo background, white text) — 3 columns: "You approve every important action" / "Your data is encrypted and yours to delete" / "See everything Amiva does in your activity log". Link → Privacy Policy.
  5. **Web dashboard teaser** — browser-frame screenshot of the Today screen: "Everything from your chats, organised on the web" + **Open the web app** (→ `/login`).
  6. **Pricing teaser** — two mini-cards (Free / Pro from §4.3) + "See full pricing".
  7. **FAQ preview** — top 4 questions (accordion) + link to `/faq`.
  8. **Final CTA band** — headline "Start in the chat you already use." + CTA pair.
- **Acceptance:** both CTAs above the fold at 360px; LCP element is the hero headline (not the mockup); all module claims match shipped MVP features (no vaporware copy).

### 4.2 Features (`/features`)
- **Purpose:** the deep-dive for evaluators; one page, anchor-linked per module (`/features#reminders` etc. — header nav and home micro-CTAs deep-link here).
- **Layout:** sticky in-page section nav (scroll-spy); per module: heading, 2–3 sentence description, 3 bullet capabilities (drawn from the PRD's user stories), a conversation snippet example styled as WhatsApp bubbles, and where relevant a dashboard screenshot. Order: Reminders · Calendar · Tasks & Lists · Memory & Search · Email · Web dashboard · Privacy & control (confirmation policy, activity log, delete-anything).
- **Acceptance:** every capability listed is MVP-real; each section shares its anchor URL cleanly (OG title reflects fragment target on share where supported).

### 4.3 Pricing (`/pricing`)
- **Purpose:** transparent tiers; convert Free users, justify Pro.
- **Layout:** toggle **NGN / KES / USD** (static conversion table at build time — no live FX; default currency by `Accept-Language`/geo hint with manual override). Two cards:
  - **Free** — "Get organised": capped monthly quotas (e.g. 30 assistant messages, 10 active reminders, memory up to 50 items — final numbers TBD by product), WhatsApp + web, Google Calendar. CTA: Start on WhatsApp.
  - **Pro** (highlighted, indigo border, "Most popular" pill) — everything unlimited*, Gmail module, voice notes, priority support. Price placeholder ~₦1,500 / KSh 250 / $1.99 per month (TBD — see scope doc unit economics). CTA: Create account. Footnote * fair-use limits.
- Below: billing FAQ accordion (payment methods — Paystack/Flutterwave cards & mobile money; cancel anytime; what happens to data on downgrade), and a comparison table (rows = features, ✓/— per tier).
- **States:** if billing isn't live at launch, Pro card shows **Join the waitlist** (email capture → simple endpoint or provider form) instead of a buy button — never a dead button.
- **Acceptance:** currency toggle changes all figures including footnotes; JSON-LD `Offer` matches displayed default currency.

### 4.4 FAQ (`/faq`)
Accordion groups: **Getting started** (Do I need to install anything? How do I link WhatsApp to the web app?), **Privacy & data** (What does Amiva store? Can I delete everything? Who can see my email?), **Features** (What can I ask? Which calendars/email work? Recurring reminders?), **Billing** (mirrors §4.3). Each answer ≤ 90 words, plain language. `FAQPage` JSON-LD. Search-filter input on top.

### 4.5 Contact / Support (`/contact`)
Short page: support email (`mailto:`), **Chat with us on WhatsApp** (same bot — the orchestrator routes "help/support" intents), response-time expectation, and links to FAQ/Privacy. No contact form at MVP (nothing to build or spam-protect).

### 4.6 Legal — Privacy Policy (`/privacy-policy`) & Terms (`/terms`)
- Rendered from Markdown/MDX (legal team owns content; engineering owns template): title, effective date, auto-generated table of contents, prose styles.
- **These URLs are load-bearing:** referenced in the Google OAuth consent screen, Meta business verification, and the in-app consent step (backend `consent_records`). They must be live, public, and stable before Phase 0 verifications are submitted. Do not rename paths after submission.
- Privacy Policy must cover (align with PRD §17): data categories stored, provider access (Google scopes) and the Google API Services User Data Policy / Limited Use disclosure, retention, deletion & export rights, encryption, no model-training on user content by default, contact for data requests.

### 4.7 Not-found & error pages
Branded 404 ("That page wandered off — Amiva can't remember everything… yet") with links home/app; minimal 500. Both static, no JS beyond header.

---

## 5. Auth & Onboarding Screens

Reached from marketing CTAs (**Get started** → `/register`, **Log in** → `/login`) or WhatsApp deep links.

### 5.1 `/register` — Sign up
- **Layout:** split screen — left: brand panel (indigo gradient, logo, one-line value prop "Manage your life from one conversation"); right: form card. Mobile: form only, logo on top.
- **Fields:** name, email, phone (intl input with country selector, default +234), password (strength meter, min 8), timezone (auto-detect via `Intl.DateTimeFormat`, editable select), ToS/Privacy consent checkbox (required, links to §4.6 pages).
- **API:** `POST /auth/register` → route to `/verify`.
- **States:** field-level validation errors from `VALIDATION_ERROR.details`; duplicate email → inline "You already have an account — log in?".

### 5.2 `/verify` — Email & phone verification
Two 6-digit OTP inputs (auto-advance, paste support), resend links with 60 s cooldown. APIs: `POST /auth/verify-email`, `POST /auth/verify-phone`. Both verified → auto-login → `/onboarding`.

### 5.3 `/login` — Log in
Email + password; "Forgot password?"; on `mfa_required` response swap to TOTP code step (`POST /auth/mfa/verify`). Success → `/app/today` (or `redirect` query param).

### 5.4 `/forgot-password` + `/reset-password`
Standard two-step; always respond "If that account exists, we sent a link".

### 5.5 `/link?token=...` — WhatsApp link landing [public → auth]
Reached from the signed link the bot sends. If not logged in: login/register first (preserve token). Then card: "Link this WhatsApp number (+234 801 •••• 678) to your Amiva account?" → **Link WhatsApp** → `POST /link/whatsapp/verify {token}` → success screen → `/app/today`. Expired token state with "Ask Amiva for a new link in WhatsApp".

### 5.6 `/onboarding` — 5-step wizard (PRD §15.1)
Progress dots; steps skippable where noted; completion state stored server-side (`PATCH /users/me`).
1. **Welcome** — capability overview (3 illustrated cards: Remind · Organise · Remember), privacy one-liner + link.
2. **Preferences** — preferred name, timezone confirm, notification channels (checkbox matrix seed), working hours.
3. **Connect Google Calendar** — benefit copy + **Connect** (`POST /integrations/google/authorize` → redirect). Skippable. On return show connected state ✓.
4. **Connect Gmail** — same pattern, explicitly optional, scope explanation ("Amiva reads only what you allow; never sends without your approval"). Skippable.
5. **First action** — inline chat box: "Try: *Remind me to call Mum tomorrow at 6 pm*" → `POST /assistant/messages`; render reply; success confetti → **Go to dashboard**.
Also step 5 shows the WhatsApp link CTA if not yet linked (QR of the `wa.me` deep link from `POST /link/whatsapp/code` + code).

---

## 6. Main App Screens

Every screen spec: **Purpose · Route · Data · Layout · Components · States · Interactions · Acceptance**.

### 6.1 Today (`/app/today`) — the home screen
- **Purpose:** answer "what does my day look like?" in <5 s.
- **Data:** `GET /calendar/agenda?date=today`, `GET /tasks?view=today`, `GET /reminders?status=scheduled&from=now&to=eod`, `GET /assistant/confirmations?status=pending`.
- **Layout:** greeting header ("Good morning, Ada" + date); AI day summary strip (cyan-tinted card, `agenda.summary` text); then 3 columns (stack on mobile): **Schedule** (timeline of events, now-line), **Reminders** (due today, each with Complete/Snooze buttons), **Tasks due** (checkbox rows). Pending-confirmations banner on top if any (amber, "1 action waiting for your approval → Review").
- **Empty state:** friendly illustration, "Nothing scheduled. Ask Amiva to set something up" + inline quick-add.
- **Interactions:** complete/snooze inline (optimistic, `POST /reminders/{id}/complete|snooze`); event click → event modal (§6.3); "+" quick-add opens command-style input routed to `POST /assistant/messages`.
- **Acceptance:** loads <3 s; every item deep-links to its module; reflects WhatsApp-made changes within 10 s (SSE).

### 6.2 Reminders (`/app/reminders`)
- **Data:** `GET /reminders` (tabs map to `status`/date filters).
- **Layout:** header + **New reminder** button; tabs: Upcoming · Recurring · Snoozed · Completed; list of `ReminderCard`s grouped by day ("Today", "Tomorrow", "Sat 2 Aug"). Card: title, time ("10:00 AM WAT"), recurrence pill (`recurrence_human`), channel icons, overflow menu (Edit, Pause, Skip next, Delete).
- **Create/Edit modal:** title; date+time picker (user tz shown); recurrence builder (None/Daily/Weekly with weekday chips/Monthly/Custom→RRULE built server-side from structured input); channels checkboxes; optional notes; link-to-task selector. Submit `POST /reminders` / `PATCH`.
- **States:** loading skeleton rows; empty per tab; error retry card. Recurring tab shows next 3 occurrences on expand (`GET /reminders/{id}` detail).
- **Acceptance:** creating "every weekday 8 am" round-trips and displays exactly as confirmed; snooze updates `next_fire_at` instantly; delivery history visible in card detail (`GET /reminders/{id}/deliveries`).

### 6.3 Calendar (`/app/calendar`)
- **Data:** `GET /calendar/events?from&to`, `GET /calendar/calendars`, availability via `GET /calendar/availability`.
- **Layout:** view switch (Day / Week / Agenda-list; month optional post-MVP), date nav (‹ Today ›), calendar-selection popover (checkboxes per Google calendar → `PUT /calendar/calendars/selection`). Week grid with event blocks (indigo fill, cancelled = strikethrough); agenda list on mobile default.
- **Event modal (view):** title, time range + tz, location/meet link, attendees with RSVP chips, description; actions: Edit, Reschedule (opens slot suggestions from availability endpoint), Cancel (danger, confirm dialog warning "Attendees will be notified" → `DELETE /calendar/events/{id}`).
- **Event modal (create/edit):** title, date, start/end (duration presets), all-day toggle, attendees (email chips), location, Meet toggle, description. Conflict warning banner if the chosen slot collides (client checks loaded events; server is source of truth).
- **Not-connected state:** full-screen prompt "Connect Google Calendar to manage your schedule" → integrations flow.
- **Acceptance:** timezone always visible; external changes appear ≤60 s; cancel requires typed/checked confirmation when attendees > 0.

### 6.4 Tasks (`/app/tasks`)
- **Data:** `GET /tasks?view=...`, projects from `GET /tasks/projects`.
- **Layout:** tabs Today · Upcoming · Overdue (red count badge) · Completed; filter bar (project select, label chips, search); task rows: checkbox, title, due chip (red when overdue), priority flag (urgent=red, high=amber, medium=violet, low=grey), project tag, subtask progress ("2/5").
- **Task detail drawer** (right, 480px): editable title/description; due date+time; priority segmented control; project & labels; subtask checklist (add/edit/reorder/complete) + **Suggest subtasks** button (`POST /tasks/{id}/suggest-subtasks` → suggestions as dismissible chips, click to add); linked reminder toggle; activity footer (created via WhatsApp · date).
- **Interactions:** checkbox completes with 300 ms undo toast (`POST /tasks/{id}/complete` / `reopen`); quick-add input on top ("Add a task…" — Enter creates via plain `POST /tasks` with title; dates set in drawer).
- **Acceptance:** views match server logic exactly (no client date math against UTC); completing a task with linked reminder cancels the reminder and shows that in the toast.

### 6.5 Lists (`/app/lists` and `/app/lists/[id]`)
- **Index:** grid of list cards (name, type icon, progress "3/8", updated). Type icons: 🛒 shopping, 🧳 packing, 📚 reading, 🎬 watch, 💡 ideas, ✔️ custom. Templates section separated. **New list** modal: name, type, optional bulk paste of items (one per line) → `POST /lists`.
- **Detail:** checklist with add-item input pinned on top (Enter adds, `POST /lists/{id}/items`); drag to reorder (`PATCH` position); completed items sink to a collapsible "Done" section; header menu: Rename, Duplicate (`POST /lists/{id}/duplicate` — offer "reset completed"), Save as template, Archive, Delete. **Suggest items** button → AI chips (add on click). Item overflow: promote to task (`POST .../promote` → toast with link).
- **Acceptance:** item toggle feels instant (<100 ms optimistic); concurrent edits from WhatsApp merge without clobbering (server positions win; SSE refetch).

### 6.6 Memories (`/app/memories`)
- **Data:** `GET /memories`, categories from `GET /memories/categories`.
- **Layout:** search bar ("Search your memories…" → `q=`); category filter pills with counts (All · Personal · Work · People · Travel · Finance · Ideas · Other); toggle Favorites / Archived; masonry of `MemoryCard`s: content (clamped 4 lines), category chip, tags, date, source icon (WhatsApp/web), star.
- **Memory detail modal:** full content (editable), category select, tag editor, favorite, archive; **Delete permanently** (danger zone: dialog explains irreversibility, requires checkbox → `DELETE /memories/{id} {confirm:true}`).
- **New memory:** button → simple textarea + optional category/tags → `POST /memories` ("Amiva will file it under Finance" — show auto-classified category returned by server, editable).
- **Header actions:** Export all (`GET /memories/export` download).
- **Acceptance:** search returns ranked hybrid results with the matched snippet highlighted; save-to-searchable <5 s; deletion removes from results immediately.

### 6.7 Chat (`/app/chat`) — web assistant
- **Purpose:** full Amiva conversation parity with WhatsApp.
- **Data:** `GET /assistant/messages` (history, infinite scroll up), `POST /assistant/messages`.
- **Layout:** message thread (assistant left with Amiva symbol avatar in cyan, user right in indigo bubbles); composer with send button and mic (Web Speech API dictation, optional); assistant messages can embed **resource cards** (created reminder/task/event rendered as mini-card with deep link) and **confirmation prompts** (inline Approve/Reject buttons wired to the backend spec's §5.9 endpoints).
- **States:** typing indicator while awaiting response; failed send → retry affordance on the bubble; empty state shows 6 example prompt chips ("Summarise my unread email", "What's my day like?", "Remind me to…").
- **Acceptance:** a confirmation created here is also approvable from WhatsApp and vice versa; `aria-live` announces replies.

### 6.8 Search overlay (⌘K from anywhere; also `/app/search`)
- **Data:** `POST /search`; source toggles from `GET /search/sources`.
- **Layout:** modal command palette: input; source filter chips (Memories, Email, Calendar, Tasks — reflect `PUT /search/sources` immediately); result: **answer block** (assistant styling, confidence badge: high=cyan/medium=amber/low=grey) + **citations list** (source icon, title, snippet, date — click deep-links: memory modal, email thread, event modal, task drawer).
- **Not-found state:** "I couldn't find that in your connected sources" + which sources were searched + "Try connecting Gmail" hint when relevant.
- **Acceptance:** never renders an answer without citations unless `not_found`; keyboard-only flow works end-to-end.

### 6.9 Email (`/app/email` and `/app/email/[threadId]`)
- **Not-connected state:** explainer + **Connect Gmail** (scope card: what Amiva can/can't do, "never sends without your approval").
- **Index:** range switch (Today / Last 24 h / This week) → `GET /email/summary`; overview strip (AI text); thread summary cards: sender, subject, importance chip (high=red outline) with `importance_reason` on hover/tap, one-line summary, suggested action chip (Reply / Read / Schedule), time, "Open in Gmail" external link.
- **Thread view:** summary header; message list (collapsed, expandable snippets); **extracted actions** panel (`POST /email/threads/{id}/extract-actions` on load): proposal cards "Create task: send signed contract by Fri" with Add/Dismiss; **Draft reply** button.
- **Draft composer:** instruction input ("Tell Amiva what to say…") + tone select (default from profile) → `POST /email/drafts` → editable draft (to/subject/body, plain rich-text); footer: **Discard** · **Save draft** · **Approve & send** (primary, danger-adjacent styling) → confirm dialog restating recipients → `POST /email/drafts/{id}/send {confirm:true}` → sent state + audit note "Logged in Activity".
- **Follow-ups:** thread menu → "Remind me if no reply by …" (`POST /email/threads/{id}/follow-up`).
- **Acceptance:** there is no UI path that sends without the explicit confirm dialog; drafts are visibly labelled "Draft — not sent".

### 6.10 Activity (`/app/activity`)
- **Data:** `GET /activity` with filters (module select, risk select, date range).
- **Layout:** timeline list: icon per module, action summary ("Sent reply to kemi@client.com"), risk chip (high=red, medium=amber, low=grey), channel icon (WhatsApp/web), result (✓/✗), timestamp. High-risk entries expandable to show confirmation details ("Approved by you, 26 Jul 14:03, via WhatsApp").
- **Purpose framing:** header copy "Everything Amiva has done, and who approved it." — this screen is a trust feature (PRD principle 6).

### 6.11 Settings (`/app/settings/*` — tabbed layout)
- **Profile** (`/profile`): name, preferred name, email (read-only + change flow), phone, timezone, locale, AI tone (segmented: Neutral / Warm / Formal / Brief), working hours (day chips + time range). `PATCH /users/me`.
- **Notifications** (`/notifications`): channel matrix table — rows: Reminders, Tasks, Daily agenda, Product updates; columns: WhatsApp, Email, Push (push disabled with "Mobile app coming soon" tooltip); quiet hours (toggle + time range + "urgent reminders override" checkbox); daily agenda toggle + time picker. `PUT /users/me/preferences/notifications`.
- **Integrations** (`/integrations`): cards per provider — Google Calendar: status, account email, connected date, calendar selection link, Disconnect (danger dialog: what stops working). Gmail: same + granted scopes list. WhatsApp: linked number, Unlink; if unlinked → link code + QR (`POST /link/whatsapp/code`).
- **Security** (`/security`): change password; MFA setup (QR from `POST /auth/mfa/setup`, verify code, recovery codes download); active sessions table (device, IP, last used, **Sign out** per row → `DELETE /auth/sessions/{id}`).
- **Privacy** (`/privacy`): data overview (`GET /privacy/overview` — counts per category, consent history); **Export my data** (`POST /privacy/export`, job status inline, download link when ready); **Delete account** danger zone (dialog: consequences list, password + type DELETE → `DELETE /account`) → logged-out farewell screen explaining the 14-day grace period.

### 6.12 Notifications feed
Bell → dropdown panel (latest 10, `GET /notifications`) with mark-all-read; "View all" → full page list. Each row deep-links to its resource.

---

## 7. Cross-Screen Behaviours

- **Pending confirmations** are global: badge in top bar, banner on Today, inline in Chat. Approving anywhere resolves everywhere (SSE invalidation).
- **Optimistic updates** for: task/todo/reminder complete, item add, favorite/archive toggles. Server-authoritative for: anything involving providers (calendar, email) — show spinners, never fake success (PRD: no claimed success without tool confirmation).
- **Error taxonomy → UX:** `PROVIDER_NOT_CONNECTED` → connect prompt; `PROVIDER_ERROR` → "Google didn't respond — your change was not made. Retry?"; `CONFIRMATION_REQUIRED` → open confirmation dialog; `RATE_LIMITED` → toast with retry countdown; network offline → banner + queued mutations paused.
- **Skeletons** on every list/detail; no layout shift (fixed-size cards).
- **Deep links** used by WhatsApp messages: `/app/reminders?id=…`, `/app/email/[threadId]`, `/app/confirmations?id=…` — all must resolve post-login (preserve through auth redirect).
- **Marketing ↔ app boundary:** marketing pages never import app code (bundle isolation); logged-in users visiting `/` see the header's **Get started** swap to **Open app** (cheap session cookie check — no API call on marketing pages).

---

## 8. Component Inventory (build first, in this order)

**App primitives:** `Button` (primary indigo / secondary violet-outline / ghost / danger; sm-md-lg; loading state) · `Input`, `Textarea`, `Select`, `Combobox`, `PhoneInput`, `OtpInput`, `DateTimePicker` (tz-aware), `RecurrencePicker` · `Card`, `Modal`, `Drawer`, `ConfirmDialog` (standard + danger variants) · `Tabs`, `SegmentedControl`, `Chip/Pill`, `Badge`, `Tooltip` · `Toast` system · `EmptyState` (illustration + title + body + CTA) · `Skeleton` · `Avatar`, `SourceIcon` (whatsapp/web/email/calendar) · `RiskChip`, `ConfidenceBadge`, `ImportanceChip` · `ResourceCard` (mini reminder/task/event/memory for chat & citations) · `ConfirmationCard` (summary, risk, expiry countdown, approve/reject) · `PageHeader`, `SidebarNav`, `TopBar`, `SearchPalette`.

**Marketing components:** `MarketingHeader`, `MarketingFooter`, `Hero`, `CtaPair` (WhatsApp + register, the single source of truth for both links), `WhatsAppMockup` (DOM-built chat bubbles), `FeatureRow`, `StepCard`, `TrustBand`, `PricingCard`, `ComparisonTable`, `FaqAccordion`, `LegalProse` (MDX wrapper), `OgImage` template.

---

## 9. Build Order for an AI Agent

1. **Foundations** — repo scaffold, tokens/theme (light+dark), generated API client + auth wrapper (login/refresh/logout against staging), route groups, app shell layout with nav. *Check: login → empty Today screen → refresh survives token expiry.*
2. **Marketing site** — §4 in full: home, features, pricing, FAQ, contact, legal templates, 404, SEO plumbing. Built **second, before app screens**, because Meta business verification and Google OAuth verification (backend Phase 0) both require the live site and legal URLs. *Check: Lighthouse ≥90 ×4 on 3G simulation; privacy/terms live at final URLs; both CTAs resolve.*
3. **Component library** — §8 app primitives with Storybook (or a `/kitchen-sink` route) in both themes. *Check: keyboard + screen-reader pass on Modal, ConfirmDialog, Tabs.*
4. **Reminders screen** end-to-end (list, create/edit modal, snooze/complete). *Check: acceptance criteria §6.2.*
5. **Tasks + Lists.** *Check: §6.4/§6.5 acceptance.*
6. **Today** (composes 3 modules + agenda).
7. **Calendar** (views, event modals, connect state).
8. **Memories + Search overlay.**
9. **Chat + global confirmations** (SSE wiring).
10. **Email** (summary, thread, draft/send flow).
11. **Settings, Activity, Privacy, Notifications.**
12. **Onboarding wizard + WhatsApp link flows.**
13. **Polish pass** — responsive audit at 360/768/1024/1440, a11y audit (axe + manual), empty/error states everywhere, dark mode audit, i18n extraction, marketing copy review against shipped features.

---
*Amiva — Confidential. Version 1.1, July 2026. Companion: AMIVA-BACKEND-SPEC.md.*
