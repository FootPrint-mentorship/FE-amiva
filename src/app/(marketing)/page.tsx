import Image from "next/image";
import Link from "next/link";
import {
  AlarmClock,
  Bell,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  Mail,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CtaPair } from "@/components/marketing/cta-pair";
import { FaqAccordion } from "@/components/marketing/faq";
import { IntegrationsChaos } from "@/components/marketing/integrations";
import { WA_LINK } from "@/lib/site";

const practical = [
  {
    eyebrow: "Reminders",
    title: "Reminders that actually reach you.",
    body: "One-time and recurring reminders, delivered through the channel you choose.",
    prompt: "Send Ada the proposal",
    result: "Reminder set for 4:00 PM",
    icon: AlarmClock,
  },
  {
    eyebrow: "Calendar",
    title: "A calendar that manages itself.",
    body: "Find open times, spot conflicts and handle time zones in a single conversation.",
    prompt: "Tuesday · 3:00 PM WAT",
    result: "Meeting confirmed",
    icon: CalendarDays,
  },
  {
    eyebrow: "Tasks & lists",
    title: "Turn conversations into things that get done.",
    body: "Capture tasks, subtasks and useful checklists before they disappear from view.",
    prompt: "7 of 8 complete",
    result: "Launch checklist",
    icon: CheckCircle2,
  },
  {
    eyebrow: "Memory",
    title: "A memory that never forgets.",
    body: "Store useful details with permission and retrieve them later with a natural question.",
    prompt: "What is Kemi's shoe size?",
    result: "EU 39, saved 12 May",
    icon: Brain,
  },
  {
    eyebrow: "Email",
    title: "Your inbox, summarised.",
    body: "Summaries, important threads, draft replies and approvals stay clear and controlled.",
    prompt: "Reply to Chioma",
    result: "Draft ready for approval",
    icon: Mail,
  },
  {
    eyebrow: "Intelligent search",
    title: "Ask once. Search everything you authorised.",
    body: "Find practical answers across reminders, email, calendar and memory without digging.",
    prompt: "Budget review is next Thursday",
    result: "Found across 3 sources",
    icon: Search,
  },
];

const toolLogos = [
  { name: "WhatsApp", src: "/logos/whatsapp.svg" },
  { name: "Google Calendar", src: "/logos/google-calendar.svg" },
  { name: "Gmail", src: "/logos/gmail.svg" },
  { name: "Google Drive", src: "/logos/google-drive.svg" },
  { name: "Slack", src: "/logos/slack.svg" },
  { name: "Notion", src: "/logos/notion.svg" },
  { name: "Zoom", src: "/logos/zoom.svg" },
  { name: "Telegram", src: "/logos/telegram.svg" },
];

function MiniAppCard({ item, dark }: { item: (typeof practical)[number]; dark?: boolean }) {
  const Icon = item.icon;
  return (
    <div
      className={`relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[18px] border p-7 shadow-[0_20px_55px_rgba(38,28,92,0.08)] ${dark
          ? "border-indigo-800 bg-indigo-900 text-white"
          : "border-[#e7e3f1] bg-[#f3f0fb] text-navy"
        }`}
    >
      <div className="flex items-center justify-between">
        <Icon className={`size-5 ${dark ? "text-cyan-400" : "text-violet-500"}`} aria-hidden />
        <span className={`text-[9px] font-semibold ${dark ? "text-white/45" : "text-ink-muted"}`}>
          Amiva
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold">{item.prompt}</p>
        <div className={`mt-5 h-1.5 rounded-full ${dark ? "bg-white/12" : "bg-white"}`}>
          <div className="h-full w-2/3 rounded-full bg-cyan-400" />
        </div>
        <p className={`mt-3 text-[10px] ${dark ? "text-white/55" : "text-ink-muted"}`}>{item.result}</p>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-[#ded9ec] bg-white shadow-[0_30px_90px_rgba(31,24,91,0.15)]">
      <div className="flex h-8 items-center gap-1.5 border-b border-line bg-[#f7f6fa] px-3">
        <i className="size-1.5 rounded-full bg-[#cbc8d7]" />
        <i className="size-1.5 rounded-full bg-[#cbc8d7]" />
        <i className="size-1.5 rounded-full bg-[#cbc8d7]" />
      </div>
      <div className="grid min-h-[300px] grid-cols-[74px_1fr] sm:min-h-[360px] sm:grid-cols-[150px_1fr]">
        <aside className="bg-indigo-900 p-4 text-white sm:p-6">
          <Image src="/brand/wordmark-white.svg" alt="Amiva" width={74} height={20} />
          <div className="mt-10 space-y-5 text-[9px] text-white/60 sm:text-[11px]">
            <p className="text-white">Today</p><p>Reminders</p><p>Calendar</p><p>Tasks</p><p>Memories</p>
          </div>
        </aside>
        <main className="p-5 sm:p-9">
          <div className="flex items-center justify-between">
            <div><p className="text-[9px] text-ink-muted">Monday, 10 August</p><h3 className="mt-1 text-xl font-bold tracking-[-0.04em] text-navy sm:text-3xl">Good morning, Amani.</h3></div>
            <span className="hidden rounded-full bg-indigo-900 px-4 py-2 text-[9px] font-semibold text-white sm:block">Talk to Amiva</span>
          </div>
          <div className="mt-7 rounded-[14px] bg-indigo-900 p-5 text-white">
            <p className="text-[9px] text-cyan-300">Today at a glance</p>
            <p className="mt-2 text-xs font-semibold sm:text-sm">Two meetings, three reminders and one item awaiting approval.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {["Next meeting", "Reminders due", "Tasks open"].map((x, i) => <div key={x} className="rounded-[12px] border border-line p-4"><p className="text-[9px] text-ink-muted">{x}</p><b className="mt-2 block text-sm text-navy">{i + 1}</b></div>)}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* ── HERO SECTION ─────────────────────────── */}
      <section className="relative overflow-hidden bg-[#fbfaff] pt-14 text-center">
        <div className="relative z-10 mx-auto max-w-[850px] px-5">
          <h1 className="mx-auto mt-2 max-w-[760px] text-[clamp(42px,5.8vw,72px)] font-bold leading-[1.04] tracking-[-0.06em] text-navy">
            Your personal chief of staff,{" "}
            <span className="mt-2 inline-block rounded-[16px] bg-[#6653cd] px-4 py-1 text-white shadow-xs">
              on WhatsApp.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-[580px] text-sm leading-relaxed text-[#73708a] sm:text-[15px]">
            Create reminders, manage meetings, organise tasks and work with email through one calm conversation.
          </p>
          <CtaPair className="mt-7 justify-center" />
        </div>

        {/* Hero Visual: iPhone Mockup (iPhone Amiva_Hero.png) & Floating Cards */}
        <div className="relative mx-auto mt-10 h-[440px] sm:h-[480px] max-w-[1020px] overflow-hidden">
          {/* Bottom Ambient Radial Gradient Glow */}
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-[380px] w-[min(1200px,100%)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_bottom,#8b76ed_0%,#b2a5f4_35%,rgba(247,245,254,0.3)_65%,transparent_75%)] opacity-85" />

          {/* iPhone Image (iPhone Amiva_Hero.png) - cut/hidden behind next section */}
          <Image
            src="/brand/iPhone Amiva_Hero.png"
            alt="Amiva conversation on an iPhone"
            width={290}
            height={596}
            priority
            className="absolute bottom-[-30px] left-1/2 z-10 h-[460px] sm:h-[500px] w-auto -translate-x-1/2 drop-shadow-[0_30px_45px_rgba(30,21,84,0.25)] object-contain"
          />

          {/* LEFT FLOATING CARD */}
          <div className="absolute left-[2%] top-[120px] sm:top-[140px] z-20 hidden w-[250px] items-center gap-3 rounded-[20px] border border-[#e7e4f2] bg-white p-4 shadow-[0_20px_50px_rgba(30,22,86,0.14)] transition-transform hover:-translate-y-1 sm:flex md:left-[5%] lg:left-[10%]">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0ecfc]">
              <AlarmClock className="size-5 text-[#7059db]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#86839b]">
                  REMINDER
                </span>
                <span className="rounded-full bg-[#f3f0fb] px-2.5 py-0.5 text-[10px] font-semibold text-[#7059db]">
                  ✓ Set
                </span>
              </div>
              <h4 className="mt-0.5 text-xs font-bold text-navy truncate">Pay rent</h4>
              <p className="text-[11px] text-[#73708a]">Friday, 9:00 AM</p>
              <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#f0edfa] pt-2 text-[10px] font-semibold text-[#7059db]">
                <Bell className="size-3.5" />
                <span>WhatsApp alert ready</span>
              </div>
            </div>
          </div>

          {/* RIGHT FLOATING CARD */}
          <div className="absolute right-[2%] top-[190px] sm:top-[210px] z-20 hidden w-[250px] items-center gap-3 rounded-[20px] border border-[#e7e4f2] bg-white p-4 shadow-[0_20px_50px_rgba(30,22,86,0.14)] transition-transform hover:-translate-y-1 sm:flex md:right-[5%] lg:right-[10%]">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0ecfc]">
              <CalendarDays className="size-5 text-[#7059db]" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#86839b]">
                  NEXT MEETING
                </span>
                <span className="rounded-full bg-[#f3f0fb] px-2.5 py-0.5 text-[10px] font-semibold text-[#7059db]">
                  ✓ Synced
                </span>
              </div>
              <h4 className="mt-0.5 text-xs font-bold text-navy truncate">Product planning</h4>
              <p className="text-[11px] text-[#73708a]">Tuesday, 2:30 PM</p>
              <div className="mt-2.5 flex items-center gap-2 border-t border-[#f0edfa] pt-2 text-[10px] text-[#73708a]">
                <div className="flex -space-x-1.5">
                  <img className="size-4 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&auto=format&fit=crop&q=80" alt="Avatar" />
                  <img className="size-4 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80" alt="Avatar" />
                  <img className="size-4 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80" alt="Avatar" />
                  <img className="size-4 rounded-full border border-white object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&auto=format&fit=crop&q=80" alt="Avatar" />
                </div>
                <span className="font-medium">4 attending</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── INTEGRATIONS STRIP (Works with the tools you already use) ─────────────────────────── */}
      <section className="relative z-20 border-y border-line/60 bg-white px-5 py-7">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-5 text-[11px] text-ink-muted">
          <b className="text-navy text-xs font-semibold">Works with the tools you already use</b>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            {toolLogos.map((tool) => (
              <span
                key={tool.name}
                className="flex size-10 items-center justify-center rounded-[12px] border border-line/70 bg-[#faf9fe] p-2 shadow-xs transition-transform hover:scale-105"
                title={tool.name}
              >
                <Image
                  src={tool.src}
                  alt={tool.name}
                  width={24}
                  height={24}
                  className="size-6 object-contain"
                />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ─────────────────────────── */}
      <section id="features" className="bg-[#fbfaff] px-5 py-28">
        <div className="mx-auto max-w-[1080px]">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
            <h2 className="max-w-[620px] text-[clamp(42px,5vw,68px)] font-bold leading-[0.98] tracking-[-0.065em] text-navy">Less managing tools.<br />More moving forward.</h2>
            <p className="max-w-[360px] text-sm leading-7 text-ink-muted">Your tools work better together. Amiva connects the details, keeps everything organised and asks before acting.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              [CheckCircle2, "Say what you need", "Use natural conversation to create tasks, reminders or plans."],
              [Sparkles, "Amiva organises it", "Your intent becomes a clear, structured action across your tools."],
              [ShieldCheck, "You stay in control", "Review important actions before anything changes or gets sent."],
            ].map(([Icon, title, body], i) => {
              const I = Icon as typeof Sparkles;
              return <div key={title as string} className={`min-h-[245px] rounded-[18px] border p-7 ${i === 2 ? "border-indigo-800 bg-indigo-900 text-white" : "border-[#e7e3f1] bg-[#f5f2fb] text-navy"}`}><I className={`size-5 ${i === 2 ? "text-cyan-400" : "text-violet-500"}`} /><h3 className="mt-20 text-lg font-bold">{title as string}</h3><p className={`mt-3 text-xs leading-6 ${i === 2 ? "text-white/60" : "text-ink-muted"}`}>{body as string}</p></div>;
            })}
          </div>
        </div>
      </section>

      {/* ── FLOATING LOGOS SECTION (IntegrationsChaos) ─────────────────────────── */}
      <IntegrationsChaos />

      <section className="bg-white px-5 py-28">
        <div className="mx-auto grid max-w-[1080px] items-center gap-14 rounded-[28px] bg-[#f1eef9] p-7 md:grid-cols-[0.75fr_1.25fr] md:p-16">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">One continuous conversation</p><h2 className="mt-5 text-[clamp(38px,4vw,58px)] font-bold leading-[1] tracking-[-0.06em] text-navy">The conversation continues, wherever you are.</h2><p className="mt-5 text-sm leading-7 text-ink-muted">Start on WhatsApp, then open the web when you need more space. Your context stays with you.</p><Link href="/register" className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-xs font-semibold text-indigo-900 shadow-card">Explore your dashboard</Link></div>
          <DashboardPreview />
        </div>
      </section>

      <section className="bg-[#fbfaff] px-5 py-28">
        <div className="mx-auto max-w-[1080px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">Practical help for real life</p>
          <h2 className="mt-5 text-[clamp(44px,5vw,68px)] font-bold leading-[1] tracking-[-0.065em] text-navy">Practical help for a full life.</h2>
          <div className="mt-16 divide-y divide-line">
            {practical.map((item, i) => <div key={item.title} className="grid items-center gap-8 py-14 md:grid-cols-[1fr_1fr] md:gap-20"><div className={i % 2 ? "md:order-2" : ""}><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-500">{item.eyebrow}</p><h3 className="mt-4 max-w-[430px] text-[clamp(28px,3vw,42px)] font-bold leading-[1.03] tracking-[-0.05em] text-navy">{item.title}</h3><p className="mt-4 max-w-[390px] text-sm leading-7 text-ink-muted">{item.body}</p><a href={WA_LINK} className="mt-5 inline-flex text-xs font-semibold text-indigo-900">Try on WhatsApp →</a></div><div className={i % 2 ? "md:order-1" : ""}><MiniAppCard item={item} dark={i === 1 || i === 4} /></div></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-24">
        <div className="mx-auto grid max-w-[1080px] gap-14 rounded-[28px] bg-indigo-900 p-8 text-white md:grid-cols-2 md:p-16">
          <div><ShieldCheck className="size-6 text-cyan-400" /><p className="mt-12 text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-300">Power that stays accountable</p><h2 className="mt-5 text-[clamp(40px,4vw,58px)] font-bold leading-[1] tracking-[-0.06em]">Powerful help,<br />under your control.</h2><p className="mt-5 max-w-[430px] text-sm leading-7 text-white/60">Amiva is designed to be useful without becoming invisible. You decide what connects and approve important actions.</p><Link href="/privacy-policy" className="mt-6 inline-flex text-xs font-semibold text-cyan-300">Read our privacy policy →</Link></div>
          <div className="self-center divide-y divide-white/15">{["You approve important actions", "Your data is encrypted and yours to delete", "Everything Amiva does stays visible"].map(x => <p key={x} className="flex items-center gap-3 py-6 text-sm"><Check className="size-4 text-cyan-400" />{x}</p>)}</div>
        </div>
      </section>

      <section className="bg-[#fbfaff] px-5 py-28">
        <div className="mx-auto max-w-[1080px]"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">Amiva on the web</p><h2 className="mt-5 max-w-[720px] text-[clamp(42px,5vw,68px)] font-bold leading-[1] tracking-[-0.065em] text-navy">Everything from your chats, organised on the web.</h2><div className="mt-14"><DashboardPreview /></div></div>
      </section>

      <section id="pricing" className="bg-[#f1eef9] px-5 py-28">
        <div className="mx-auto max-w-[1080px]"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">Simple pricing</p><h2 className="mt-5 max-w-[650px] text-[clamp(42px,5vw,64px)] font-bold leading-[1] tracking-[-0.06em] text-navy">Start free. Upgrade when you need more help.</h2><div className="mx-auto mt-14 grid max-w-[760px] gap-5 md:grid-cols-2">{[
          { name: "Free", price: "₦0", desc: "Get organised with the essentials.", items: ["Reminders and tasks", "Basic memory", "WhatsApp conversation"] },
          { name: "Pro", price: "₦1,500", desc: "More capacity for a fuller schedule.", items: ["Everything in Free", "Email summaries", "Priority support"], popular: true },
        ].map(plan => <div key={plan.name} className={`relative flex min-h-[390px] flex-col rounded-[20px] border bg-white p-8 ${plan.popular ? "border-indigo-900 shadow-[0_25px_70px_rgba(32,24,91,0.12)]" : "border-line"}`}>{plan.popular && <span className="absolute right-6 top-6 rounded-full bg-indigo-50 px-3 py-1 text-[9px] font-bold uppercase text-indigo-900">Most popular</span>}<p className="text-xs font-semibold text-violet-500">{plan.name}</p><h3 className="mt-8 text-5xl font-bold tracking-[-0.06em] text-navy">{plan.price}</h3><p className="mt-3 text-xs text-ink-muted">{plan.desc}</p><ul className="mt-8 space-y-4 text-xs text-navy">{plan.items.map(x => <li key={x} className="flex gap-2"><Check className="size-4 text-violet-500" />{x}</li>)}</ul><Link href="/register" className={`mt-auto flex min-h-11 items-center justify-center rounded-full text-xs font-semibold ${plan.popular ? "bg-indigo-900 text-white" : "bg-[#f4f2f8] text-indigo-900"}`}>{plan.popular ? "Join the waitlist" : "Get started"}</Link></div>)}</div><p className="mt-8 text-center text-[10px] text-ink-muted">See full pricing details and fair-use limits at checkout.</p></div>
      </section>

      <section id="faq" className="bg-white px-5 py-28">
        <div className="mx-auto grid max-w-[1080px] gap-16 rounded-[28px] bg-[#fbfaff] p-7 md:grid-cols-[0.75fr_1.25fr] md:p-16"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet-500">Here when you need it</p><h2 className="mt-5 text-[clamp(40px,4vw,58px)] font-bold leading-[1] tracking-[-0.06em] text-navy">Frequently asked questions.</h2><p className="mt-5 text-sm leading-7 text-ink-muted">Still have a question? We are happy to help.</p><a href={WA_LINK} className="mt-7 inline-flex rounded-full bg-indigo-900 px-5 py-3 text-xs font-semibold text-white">Contact us</a></div><FaqAccordion /></div>
      </section>
    </>
  );
}
