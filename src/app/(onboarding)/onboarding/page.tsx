"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlarmClock,
  Brain,
  CalendarDays,
  Check,
  ListChecks,
  Mail,
  MessageCircle,
  Send,
  Smartphone,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { BrandPanel } from "@/components/brand-panel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { OtpInput } from "@/components/ui/otp-input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { WA_LINK } from "@/lib/site";
import { setAuthed } from "@/lib/session";
import { useStore } from "@/lib/store";
import { settingsStore } from "@/lib/stores";

const steps = ["Welcome", "Preferences", "Verify phone", "Calendar", "Gmail", "First action"];

const capabilities = [
  { icon: AlarmClock, title: "Remind", body: "One-time and recurring reminders, delivered where you'll see them." },
  { icon: ListChecks, title: "Organise", body: "Calendar, tasks and checklists managed from one conversation." },
  { icon: Brain, title: "Remember", body: "A personal memory you control. Save once, find forever." },
];

const channelOptions = ["WhatsApp", "Email"] as const;
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function OnboardingPage() {
  const router = useRouter();
  const settings = useStore(settingsStore);
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState(() => ({
    preferredName: settingsStore.get().preferredName,
    channels: ["WhatsApp"] as string[],
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as string[],
    workStart: "09:00",
    workEnd: "17:00",
  }));
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [tryText, setTryText] = useState("Remind me to call Mum tomorrow at 6 pm");
  const [tried, setTried] = useState(false);

  // phone verification (skippable — OTP goes only to the channel being verified)
  const [phoneStage, setPhoneStage] = useState<"idle" | "sent">("idle");
  const [phoneOtp, setPhoneOtp] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finishToApp = () => {
    setAuthed(true);
    router.push("/app/today");
  };

  const sendPhoneCode = () => {
    setPhoneStage("sent");
    toast("Code sent to your WhatsApp number.");
  };

  const onPhoneOtp = (code: string) => {
    setPhoneOtp(code);
    if (code.length === 6) {
      settingsStore.set((c) => ({ ...c, phoneVerified: true }));
      toast("Phone verified. WhatsApp delivery is live.");
      next();
    }
  };

  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <main className="relative flex flex-1 flex-col items-center bg-soft px-5 py-10">
        {/* Skip onboarding entirely */}
        <button
          onClick={finishToApp}
          className="absolute right-5 top-5 cursor-pointer text-sm font-medium text-ink-muted hover:text-navy"
        >
          Skip onboarding →
        </button>

        <Link href="/" className="lg:hidden" aria-label="Amiva home">
          <Logo size={30} />
        </Link>

        {/* Progress dots (visited steps are clickable) */}
        <div className="mt-8 flex items-center gap-2" aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}>
          {steps.map((label, i) => (
            <button
              key={label}
              aria-label={`Go to step ${i + 1}: ${label}`}
              disabled={i >= step}
              onClick={() => setStep(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step ? "w-8 bg-indigo-900" : i < step ? "w-2 cursor-pointer bg-cyan-500" : "w-2 bg-line"
              )}
            />
          ))}
        </div>
        {step > 0 && (
          <button
            onClick={back}
            className="mt-3 cursor-pointer text-sm font-medium text-ink-muted hover:text-navy"
          >
            ← Back
          </button>
        )}

        <div className="mt-6 w-full max-w-140">
          {/* 1 · Welcome */}
          {step === 0 && (
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">
                Meet Amiva, your personal chief of staff
              </h1>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {capabilities.map((c) => (
                  <div key={c.title} className="rounded-xl bg-soft p-4 text-left">
                    <c.icon className="size-5 text-violet-500" aria-hidden />
                    <p className="mt-2 font-semibold text-navy">{c.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{c.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-ink-muted">
                Amiva only remembers what you allow, and asks before doing anything
                important.{" "}
                <Link href="/privacy-policy" target="_blank" className="text-indigo-900 hover:underline">
                  How we handle your data
                </Link>
              </p>
              <Button className="mt-6 w-full" size="lg" onClick={next}>
                Let&apos;s set you up
              </Button>
            </Card>
          )}

          {/* 2 · Preferences */}
          {step === 1 && (
            <Card className="p-8">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">Your preferences</h1>
              <div className="mt-6 space-y-5">
                <Field
                  label="What should Amiva call you?"
                  value={prefs.preferredName}
                  onChange={(e) => setPrefs({ ...prefs, preferredName: e.target.value })}
                />
                <div>
                  <p className="mb-2 text-sm font-medium text-navy">Where should notifications go?</p>
                  <div className="flex gap-2">
                    {channelOptions.map((c) => {
                      const on = prefs.channels.includes(c);
                      return (
                        <button
                          key={c}
                          aria-pressed={on}
                          onClick={() =>
                            setPrefs({
                              ...prefs,
                              channels: on
                                ? prefs.channels.filter((x) => x !== c)
                                : [...prefs.channels, c],
                            })
                          }
                          className={cn(
                            "cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                            on
                              ? "border-indigo-900 bg-indigo-900 text-white"
                              : "border-line bg-white text-ink-muted hover:border-indigo-300"
                          )}
                        >
                          {on && <Check className="mr-1 inline size-3.5" aria-hidden />}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-navy">Working days</p>
                  <div className="flex flex-wrap gap-1.5">
                    {days.map((d) => {
                      const on = prefs.workDays.includes(d);
                      return (
                        <button
                          key={d}
                          aria-pressed={on}
                          onClick={() =>
                            setPrefs({
                              ...prefs,
                              workDays: on
                                ? prefs.workDays.filter((x) => x !== d)
                                : [...prefs.workDays, d],
                            })
                          }
                          className={cn(
                            "size-9 cursor-pointer rounded-full text-xs font-semibold transition-colors",
                            on ? "bg-indigo-900 text-white" : "border border-line bg-white text-ink-muted"
                          )}
                        >
                          {d[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <label className="flex-1 text-sm font-medium text-navy">
                    Start
                    <input
                      type="time"
                      value={prefs.workStart}
                      onChange={(e) => setPrefs({ ...prefs, workStart: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[10px] border border-line bg-white px-3 text-[15px] font-normal"
                    />
                  </label>
                  <label className="flex-1 text-sm font-medium text-navy">
                    End
                    <input
                      type="time"
                      value={prefs.workEnd}
                      onChange={(e) => setPrefs({ ...prefs, workEnd: e.target.value })}
                      className="mt-1.5 h-11 w-full rounded-[10px] border border-line bg-white px-3 text-[15px] font-normal"
                    />
                  </label>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    settingsStore.set((c) => ({
                      ...c,
                      preferredName: prefs.preferredName.trim() || c.preferredName,
                    }));
                    next();
                  }}
                >
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {/* 3 · Verify phone (skippable; OTP only to the chosen medium) */}
          {step === 2 && (
            <Card className="p-8">
              <span className="flex size-12 items-center justify-center rounded-[14px] bg-indigo-50">
                <Smartphone className="size-6 text-indigo-900" aria-hidden />
              </span>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
                Verify your phone
              </h1>
              {settings.phoneVerified ? (
                <>
                  <p className="mt-5 flex items-center gap-2 rounded-[10px] bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <Check className="size-4" aria-hidden /> Phone already verified
                  </p>
                  <Button className="mt-5 w-full" size="lg" onClick={next}>
                    Continue
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    Amiva delivers reminders on WhatsApp only after your number is
                    verified. We&apos;ll send a one-time code there — nowhere else.
                  </p>
                  {phoneStage === "idle" ? (
                    <Button className="mt-5 w-full" size="lg" onClick={sendPhoneCode}>
                      Send code to WhatsApp
                    </Button>
                  ) : (
                    <div className="mt-5 rounded-xl border border-line bg-soft p-4">
                      <p className="mb-2 text-xs text-ink-muted">Enter the 6-digit code.</p>
                      <OtpInput value={phoneOtp} onChange={onPhoneOtp} label="Phone code" />
                    </div>
                  )}
                  <div className="mt-3">
                    <button onClick={next} className="cursor-pointer text-sm text-ink-muted hover:text-navy">
                      Skip for now
                    </button>
                    <p className="mt-1.5 text-xs text-ink-muted">
                      You can verify later in Settings. Until then, nothing is sent to
                      this number.
                    </p>
                  </div>
                </>
              )}
            </Card>
          )}

          {/* 4 · Calendar */}
          {step === 3 && (
            <Card className="p-8">
              <span className="flex size-12 items-center justify-center rounded-[14px] bg-indigo-50">
                <CalendarDays className="size-6 text-indigo-900" aria-hidden />
              </span>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
                Connect Google Calendar
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Amiva can create events, spot conflicts and find free slots.
                It only requests the calendar permissions it needs, and you can
                disconnect any time.
              </p>
              {calendarConnected ? (
                <p className="mt-5 flex items-center gap-2 rounded-[10px] bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <Check className="size-4" aria-hidden /> Google Calendar connected
                </p>
              ) : (
                <Button className="mt-5 w-full" size="lg" onClick={() => setCalendarConnected(true)}>
                  Connect Google Calendar
                </Button>
              )}
              <div className="mt-3 flex justify-between">
                <button onClick={next} className="cursor-pointer text-sm text-ink-muted hover:text-navy">
                  Skip for now
                </button>
                {calendarConnected && (
                  <Button size="sm" variant="ghost" onClick={next}>
                    Continue →
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* 5 · Gmail */}
          {step === 4 && (
            <Card className="p-8">
              <span className="flex size-12 items-center justify-center rounded-[14px] bg-indigo-50">
                <Mail className="size-6 text-indigo-900" aria-hidden />
              </span>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-navy">
                Connect Gmail <span className="text-base font-normal text-ink-muted">(optional)</span>
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                Get inbox summaries and drafted replies. Amiva reads only what
                you allow and <strong>never sends an email without your approval</strong>.
              </p>
              {gmailConnected ? (
                <p className="mt-5 flex items-center gap-2 rounded-[10px] bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <Check className="size-4" aria-hidden /> Gmail connected
                </p>
              ) : (
                <Button className="mt-5 w-full" size="lg" onClick={() => setGmailConnected(true)}>
                  Connect Gmail
                </Button>
              )}
              <div className="mt-3 flex justify-between">
                <button onClick={next} className="cursor-pointer text-sm text-ink-muted hover:text-navy">
                  Skip for now
                </button>
                {gmailConnected && (
                  <Button size="sm" variant="ghost" onClick={next}>
                    Continue →
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* 6 · First action */}
          {step === 5 && (
            <Card className="p-8">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">
                Try your first request
              </h1>
              <div className="mt-5 flex gap-2">
                <input
                  value={tryText}
                  onChange={(e) => setTryText(e.target.value)}
                  aria-label="Try a request"
                  className="h-11 flex-1 rounded-[10px] border border-line bg-white px-3.5 text-[15px] text-navy"
                />
                <Button onClick={() => setTried(true)} aria-label="Send">
                  <Send className="size-4" aria-hidden />
                </Button>
              </div>
              {tried && (
                <div className="mt-4 rounded-xl border border-line bg-soft p-4">
                  <p className="text-sm text-navy">
                    ⏰ Done, {prefs.preferredName}. I&apos;ll remind you{" "}
                    <strong>tomorrow at 6:00 PM (WAT)</strong>: &quot;Call Mum&quot;.
                  </p>
                </div>
              )}
              <div className="mt-6 rounded-xl bg-[#d9fdd3]/60 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-navy">
                  <MessageCircle className="size-4 text-[#075e54]" aria-hidden />
                  Prefer WhatsApp? Say hello and Amiva will link your chat:
                </p>
                <a
                  href={WA_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-semibold text-[#075e54] hover:underline"
                >
                  Open WhatsApp →
                </a>
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={finishToApp}>
                Go to my dashboard
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
