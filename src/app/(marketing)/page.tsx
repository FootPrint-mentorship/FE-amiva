import Link from "next/link";
import {
  AlarmClock,
  CalendarDays,
  Brain,
  Mail,
  ListChecks,
  ShieldCheck,
  Trash2,
  ScrollText,
  MessageCircle,
  Link2,
  Sparkles,
  Check,
} from "lucide-react";
import { CtaPair } from "@/components/marketing/cta-pair";
import { WhatsAppMockup } from "@/components/marketing/whatsapp-mockup";
import { FaqAccordion } from "@/components/marketing/faq";
import { WA_LINK } from "@/lib/site";

const steps = [
  {
    icon: MessageCircle,
    title: "Say hello on WhatsApp",
    body: "Message Amiva like you'd message a friend. No downloads, no setup wizard.",
  },
  {
    icon: Link2,
    title: "Connect your tools",
    body: "Link Google Calendar and Gmail securely. You choose exactly what Amiva can see.",
  },
  {
    icon: Sparkles,
    title: "Ask for anything",
    body: "Say “remind me”, “schedule”, “remember” or “find”. Amiva handles the rest.",
  },
];

const features = [
  {
    icon: AlarmClock,
    title: "Reminders that actually reach you",
    body: "Set it in one sentence and get it on WhatsApp, email or both. One-time, daily, weekly or custom schedules, with snooze and reschedule right from the chat.",
    example: "“Remind me to pay NEPA every last Friday of the month”",
  },
  {
    icon: CalendarDays,
    title: "A calendar that manages itself",
    body: "Amiva creates, moves and cancels events, finds free slots that work for everyone, and handles time zones so nobody shows up an hour late.",
    example: "“Move my 2pm with Tunde to Friday morning”",
  },
  {
    icon: Brain,
    title: "A memory that never forgets",
    body: "Tell Amiva once, whether it's account numbers, sizes, ideas or addresses, and find it forever with a plain question. You control everything it remembers.",
    example: "“What's my landlord's account number?”",
  },
  {
    icon: Mail,
    title: "Your inbox, summarised",
    body: "Amiva reads what you allow, tells you what actually needs attention, and drafts replies in your tone. Nothing is ever sent without your approval.",
    example: "“Summarise my unread email”",
  },
  {
    icon: ListChecks,
    title: "Tasks and lists from voice notes",
    body: "Send a voice note on the go and Amiva turns it into tasks, shopping lists and checklists you can tick off from WhatsApp or the web.",
    example: "“Add rice, beans and titus to my shopping list”",
  },
];

const trust = [
  {
    icon: ShieldCheck,
    title: "You approve every important action",
    body: "Sending email, cancelling meetings, deleting data: Amiva always asks first.",
  },
  {
    icon: Trash2,
    title: "Your data is yours",
    body: "Encrypted, never used to train AI models, and completely deletable whenever you choose.",
  },
  {
    icon: ScrollText,
    title: "Nothing happens in the dark",
    body: "Every action Amiva takes is recorded in an activity log you can review any time.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* 1 · Hero */}
      <section className="bg-gradient-to-b from-soft to-white">
        <div className="mx-auto grid w-full max-w-285 items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="text-[clamp(2.5rem,5vw,3.5rem)] font-bold leading-[1.08] tracking-tight text-navy">
              Your personal chief of staff,{" "}
              <span className="text-indigo-900">on WhatsApp.</span>
            </h1>
            <p className="mt-5 max-w-120 text-lg leading-relaxed text-ink-muted">
              Reminders, calendar, email and memory, managed through one
              natural conversation. Amiva remembers, plans and follows through,
              so you don&apos;t have to.
            </p>
            <CtaPair className="mt-8" />
            <p className="mt-4 text-sm text-ink-muted">
              Free to start · No app to install
            </p>
          </div>
          <WhatsAppMockup />
        </div>
      </section>

      {/* 2 · How it works */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto w-full max-w-285 px-5 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-navy">
            Up and running in one minute
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="rounded-2xl border border-line bg-soft p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-indigo-900 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <s.icon className="size-5 text-violet-500" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold text-navy">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · Feature tour */}
      <section id="features" className="border-t border-line bg-white scroll-mt-16">
        <div className="mx-auto w-full max-w-285 px-5 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-navy">
            One conversation. Everything handled.
          </h2>
          <div className="mt-14 space-y-14">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`grid items-center gap-8 md:grid-cols-2 ${
                  i % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50">
                    <f.icon className="size-5 text-indigo-900" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-navy">
                    {f.title}
                  </h3>
                  <p className="mt-3 max-w-110 leading-relaxed text-ink-muted">
                    {f.body}
                  </p>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-indigo-900 hover:underline"
                  >
                    Try it on WhatsApp →
                  </a>
                </div>
                <div className="rounded-2xl border border-line bg-soft p-8">
                  <p className="rounded-xl rounded-tr-sm bg-[#d9fdd3] px-4 py-3 text-[15px] text-[#111b21] shadow-sm md:ml-10">
                    {f.example}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 · Trust band */}
      <section className="bg-indigo-900 text-white">
        <div className="mx-auto grid w-full max-w-285 gap-10 px-5 py-16 md:grid-cols-3">
          {trust.map((t) => (
            <div key={t.title}>
              <t.icon className="size-6 text-cyan-500" aria-hidden />
              <h3 className="mt-3 font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                {t.body}
              </p>
            </div>
          ))}
        </div>
        <div className="pb-12 text-center">
          <Link
            href="/privacy-policy"
            className="text-sm text-cyan-500 hover:underline"
          >
            Read our privacy policy →
          </Link>
        </div>
      </section>

      {/* 5 · Pricing teaser */}
      <section id="pricing" className="bg-white scroll-mt-16">
        <div className="mx-auto w-full max-w-285 px-5 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-navy">
            Simple pricing, local currency
          </h2>
          <div className="mx-auto mt-12 grid max-w-190 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-7 shadow-card">
              <p className="font-semibold text-navy">Free</p>
              <p className="mt-1 text-3xl font-bold text-navy">₦0</p>
              <p className="text-sm text-ink-muted">Get organised</p>
              <ul className="mt-5 space-y-2.5 text-sm text-ink-muted">
                {["WhatsApp + web dashboard", "Reminders & lists", "Google Calendar", "Personal memory (starter)"].map((x) => (
                  <li key={x} className="flex gap-2">
                    <Check className="size-4 shrink-0 text-success" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-[10px] border border-indigo-300 text-sm font-medium text-indigo-900 hover:bg-indigo-50"
              >
                Start on WhatsApp
              </a>
            </div>
            <div className="relative rounded-2xl border-2 border-indigo-900 bg-white p-7 shadow-pop">
              <span className="absolute -top-3 left-6 rounded-full bg-cyan-500 px-3 py-0.5 text-xs font-semibold text-navy">
                Most popular
              </span>
              <p className="font-semibold text-navy">Pro</p>
              <p className="mt-1 text-3xl font-bold text-navy">
                ₦1,500<span className="text-base font-medium text-ink-muted">/mo</span>
              </p>
              <p className="text-sm text-ink-muted">Your full chief of staff</p>
              <ul className="mt-5 space-y-2.5 text-sm text-ink-muted">
                {["Everything in Free, unlimited*", "Email summaries & drafts", "Voice notes", "Priority support"].map((x) => (
                  <li key={x} className="flex gap-2">
                    <Check className="size-4 shrink-0 text-success" aria-hidden /> {x}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-indigo-900 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Create account
              </Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-ink-muted">
            * Fair-use limits apply. Prices shown in NGN; KES and USD available
            at checkout.
          </p>
        </div>
      </section>

      {/* 6 · FAQ */}
      <section id="faq" className="border-t border-line bg-soft scroll-mt-16">
        <div className="mx-auto w-full max-w-285 px-5 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-navy">
            Questions, answered
          </h2>
          <div className="mt-10">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* 7 · Final CTA */}
      <section className="bg-navy">
        <div className="mx-auto flex w-full max-w-285 flex-col items-center px-5 py-20 text-center">
          <h2 className="max-w-140 text-3xl font-semibold tracking-tight text-white">
            Start in the chat you already use.
          </h2>
          <CtaPair className="mt-8 justify-center" invert />
        </div>
      </section>
    </>
  );
}
