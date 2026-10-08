"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  AlarmClock,
  Brain,
  CalendarDays,
  Check,
  ListChecks,
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
import { PhoneField } from "@/components/ui/phone-field";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { buildE164 } from "@/lib/phone";
import { waLink } from "@/lib/site";
import { EVENTS, track } from "@/lib/analytics";
import { sendAssistantMessage } from "@/lib/data/assistant";
import { connectGoogle } from "@/lib/data/integrations";
import { api, ApiError } from "@/lib/api/client";
import { setAuthed } from "@/lib/session";
import { useStore } from "@/lib/store";
import { settingsStore } from "@/lib/stores";
import {
  sendPhoneCode as sendPhoneCodeApi,
  verifyPhoneCode,
} from "@/lib/data/settings";

// Internal ids stay English (working_hours maps them to ISO weekday numbers,
// Mon=1); only the labels are localized.
const channelOptions = ["WhatsApp", "Email"] as const;
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_KEYS = {
  Mon: "dayMon",
  Tue: "dayTue",
  Wed: "dayWed",
  Thu: "dayThu",
  Fri: "dayFri",
  Sat: "daySat",
  Sun: "daySun",
} as const;

/** PATCH the wizard's preferences to /users/me (working_hours drives the
 * assistant's availability math — ISO weekday numbers, Mon=1). */
function savePreferences(prefs: {
  preferredName: string;
  workDays: string[];
  workStart: string;
  workEnd: string;
}): Promise<unknown> {
  return api("/users/me", {
    method: "PATCH",
    body: {
      ...(prefs.preferredName.trim()
        ? { preferred_name: prefs.preferredName.trim() }
        : {}),
      working_hours: {
        start: prefs.workStart,
        end: prefs.workEnd,
        days: prefs.workDays.map((d) => days.indexOf(d as (typeof days)[number]) + 1),
      },
    },
  });
}

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const settings = useStore(settingsStore);
  const steps = [
    t("stepWelcome"),
    t("stepPreferences"),
    t("stepPhone"),
    t("stepCalendar"),
    t("stepFirst"),
  ];
  const capabilities = [
    { icon: AlarmClock, title: t("capRemindTitle"), body: t("capRemindBody") },
    { icon: ListChecks, title: t("capOrganiseTitle"), body: t("capOrganiseBody") },
    { icon: Brain, title: t("capRememberTitle"), body: t("capRememberBody") },
  ];
  const channelLabel = { WhatsApp: t("channelWhatsApp"), Email: t("channelEmail") } as const;
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState(() => ({
    preferredName: settingsStore.get().preferredName,
    channels: ["WhatsApp"] as string[],
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"] as string[],
    workStart: "09:00",
    workEnd: "17:00",
  }));
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Google OAuth bounce-back: the API callback redirects to
  // /onboarding?connected=google[&error=…] when the flow started here.
  // Resume at the Calendar step, say what happened, clean the URL.
  // (Deferred callback, not the effect body — setState-in-effect idiom.)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") !== "google") return;
    const tm = setTimeout(() => {
      setStep(3); // the Calendar step
      if (params.get("error")) {
        toast(t("googleFailedToast"), { tone: "error" });
      } else {
        setCalendarConnected(true); // the callback only redirects clean after the exchange
        toast(t("googleConnectedToast"));
      }
      window.history.replaceState(null, "", "/onboarding");
    }, 0);
    return () => clearTimeout(tm);
  }, [t]);

  const startCalendarConnect = () => {
    setConnecting(true);
    connectGoogle("calendar", "/onboarding").catch(() => {
      setConnecting(false);
      toast(t("googleNotConfigured"), { tone: "error" });
    });
  };
  const [tryText, setTryText] = useState(() => t("tryDefault"));
  const [trying, setTrying] = useState(false);
  const [tryReply, setTryReply] = useState<string | null>(null);

  // The first request goes to the real assistant — whatever the user typed,
  // not a canned demo line (a user caught the old hardcoded reply).
  const sendFirstRequest = () => {
    const text = tryText.trim();
    if (!text || trying) return;
    setTrying(true);
    setTryReply(null);
    track(EVENTS.firstRequestSent);
    sendAssistantMessage(text)
      .then((res) => setTryReply(res.reply))
      .catch(() => setTryReply(t("tryFailed")))
      .finally(() => setTrying(false));
  };

  // phone verification (skippable — OTP goes only to the channel being verified)
  const [phoneStage, setPhoneStage] = useState<"idle" | "sent">("idle");
  const [phoneOtp, setPhoneOtp] = useState("");
  // A number the account already carries (registered with one) can be verified
  // as-is; otherwise the user must enter one here — without this the step sent
  // an empty send-code and 422'd with only a misleading "try again" toast.
  const [newCc, setNewCc] = useState("+234");
  const [newPhone, setNewPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [sendingPhone, setSendingPhone] = useState(false);
  const hasNumberOnFile = Boolean(settings.phone);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finishToApp = () => {
    setAuthed(true);
    track(EVENTS.onboardingFinished, { step: step + 1 });
    router.push("/app/today");
  };

  const sendPhoneCode = () => {
    // Verify a number already on the account; the field path uses its own
    // handler so the two never send an empty body.
    setPhoneStage("sent");
    sendPhoneCodeApi()
      .then(() => toast(t("codeSentToast")))
      .catch(() => {
        setPhoneStage("idle");
        toast(t("codeFailedToast"), { tone: "error" });
      });
  };

  const sendCodeToNewNumber = () => {
    const digits = newPhone.replace(/[\s()-]/g, "");
    if (digits.length < 7) {
      setPhoneErr(t("errorEnterFull"));
      return;
    }
    setPhoneErr("");
    setSendingPhone(true);
    sendPhoneCodeApi(buildE164(newCc, digits))
      .then(() => setPhoneStage("sent"))
      .catch((err) =>
        setPhoneErr(
          err instanceof ApiError && err.code === "CONFLICT"
            ? t("errorPhoneConflict")
            : err instanceof ApiError && err.details?.reason === "not_on_whatsapp"
              ? t("errorNotOnWhatsApp")
              : t("codeFailedToast")
        )
      )
      .finally(() => setSendingPhone(false));
  };

  const onPhoneOtp = (code: string) => {
    setPhoneOtp(code);
    if (code.length === 6) {
      verifyPhoneCode(code)
        .then(() => {
          toast(t("phoneVerifiedToast"));
          next();
        })
        .catch(() => {
          setPhoneOtp("");
          toast(t("codeMismatchToast"), { tone: "error" });
        });
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
          {t("skip")}
        </button>

        <Link href="/" className="lg:hidden" aria-label="Amiva">
          <Logo size={30} />
        </Link>

        {/* Progress dots (visited steps are clickable) */}
        <div
          className="mt-8 flex items-center gap-2"
          aria-label={t("stepLabel", { n: step + 1, total: steps.length, label: steps[step] })}
        >
          {steps.map((label, i) => (
            <button
              key={label}
              aria-label={t("goToStep", { n: i + 1, label })}
              disabled={i >= step}
              onClick={() => setStep(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === step
                  ? "w-8 bg-indigo-900"
                  : i < step
                    ? "w-2 cursor-pointer bg-cyan-500"
                    : "w-2 bg-line",
              )}
            />
          ))}
        </div>
        {step > 0 && (
          <button
            onClick={back}
            className="mt-3 cursor-pointer text-sm font-medium text-ink-muted hover:text-navy"
          >
            {t("back")}
          </button>
        )}

        <div className="mt-6 w-full max-w-140">
          {/* 1 · Welcome */}
          {step === 0 && (
            <Card className="p-8 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">
                {t("welcomeTitle")}
              </h1>
              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {capabilities.map((c) => (
                  <div
                    key={c.title}
                    className="rounded-xl bg-soft p-4 text-left"
                  >
                    <c.icon className="size-5 text-violet-500" aria-hidden />
                    <p className="mt-2 font-semibold text-navy">{c.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      {c.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-ink-muted">
                {t("privacyNote")}{" "}
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  className="text-indigo-900 hover:underline"
                >
                  {t("privacyLink")}
                </Link>
              </p>
              <Button className="mt-6 w-full" size="lg" onClick={next}>
                {t("letsGo")}
              </Button>
            </Card>
          )}

          {/* 2 · Preferences */}
          {step === 1 && (
            <Card className="p-8">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">
                {t("prefsTitle")}
              </h1>
              <div className="mt-6 space-y-5">
                <Field
                  label={t("callYou")}
                  value={prefs.preferredName}
                  onChange={(e) =>
                    setPrefs({ ...prefs, preferredName: e.target.value })
                  }
                />
                <div>
                  <p className="mb-2 text-sm font-medium text-navy">
                    {t("notifWhere")}
                  </p>
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
                              : "border-line bg-white text-ink-muted hover:border-indigo-300",
                          )}
                        >
                          {on && (
                            <Check
                              className="mr-1 inline size-3.5"
                              aria-hidden
                            />
                          )}
                          {channelLabel[c]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-sm font-medium text-navy">
                    {t("workingDays")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {days.map((d) => {
                      const on = prefs.workDays.includes(d);
                      const label = t(DAY_KEYS[d]);
                      return (
                        <button
                          key={d}
                          aria-pressed={on}
                          aria-label={label}
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
                            on
                              ? "bg-indigo-900 text-white"
                              : "border border-line bg-white text-ink-muted",
                          )}
                        >
                          {label[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <label className="flex-1 text-sm font-medium text-navy">
                    {t("start")}
                    <input
                      type="time"
                      value={prefs.workStart}
                      onChange={(e) =>
                        setPrefs({ ...prefs, workStart: e.target.value })
                      }
                      className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-3 text-[15px] font-normal"
                    />
                  </label>
                  <label className="flex-1 text-sm font-medium text-navy">
                    {t("end")}
                    <input
                      type="time"
                      value={prefs.workEnd}
                      onChange={(e) =>
                        setPrefs({ ...prefs, workEnd: e.target.value })
                      }
                      className="mt-1.5 h-11 w-full rounded-control border border-line bg-white px-3 text-[15px] font-normal"
                    />
                  </label>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    settingsStore.set((c) => ({
                      ...c,
                      preferredName:
                        prefs.preferredName.trim() || c.preferredName,
                    }));
                    // Persist name + working hours server-side (availability
                    // math uses them) — best-effort, the wizard moves on.
                    savePreferences(prefs).catch(() =>
                      toast(t("prefsSaveFailed"), { tone: "error" })
                    );
                    next();
                  }}
                >
                  {t("continue")}
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
                {t("phoneTitle")}
              </h1>
              {settings.phoneVerified ? (
                <>
                  <p className="mt-5 flex items-center gap-2 rounded-control bg-success/10 px-4 py-3 text-sm font-medium text-success">
                    <Check className="size-4" aria-hidden /> {t("phoneAlreadyVerified")}
                  </p>
                  <Button className="mt-5 w-full" size="lg" onClick={next}>
                    {t("continue")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                    {t("phoneBody")}
                  </p>
                  {phoneStage === "sent" ? (
                    <div className="mt-5 rounded-xl border border-line bg-soft p-4">
                      <p className="mb-2 text-xs text-ink-muted">{t("enterCode")}</p>
                      <OtpInput
                        value={phoneOtp}
                        onChange={onPhoneOtp}
                        label={t("phoneCode")}
                      />
                    </div>
                  ) : hasNumberOnFile ? (
                    <Button
                      className="mt-5 w-full"
                      size="lg"
                      onClick={sendPhoneCode}
                    >
                      {t("sendToWhatsApp")}
                    </Button>
                  ) : (
                    // No number on file (phone is optional at signup) — collect
                    // one here instead of firing an empty send-code that 422s.
                    <div className="mt-5">
                      <PhoneField
                        cc={newCc}
                        phone={newPhone}
                        onCcChange={setNewCc}
                        onPhoneChange={(v) => {
                          setNewPhone(v);
                          if (phoneErr) setPhoneErr("");
                        }}
                        error={phoneErr || undefined}
                      />
                      <Button
                        className="mt-4 w-full"
                        size="lg"
                        onClick={sendCodeToNewNumber}
                        loading={sendingPhone}
                      >
                        {t("sendToWhatsApp")}
                      </Button>
                    </div>
                  )}
                  <div className="mt-3">
                    <button
                      onClick={next}
                      className="cursor-pointer text-sm text-ink-muted hover:text-navy"
                    >
                      {t("skipForNow")}
                    </button>
                    <p className="mt-1.5 text-xs text-ink-muted">{t("phoneLater")}</p>
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
                {t("calendarTitle")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t("calendarBody")}
              </p>
              {calendarConnected ? (
                <p className="mt-5 flex items-center gap-2 rounded-control bg-success/10 px-4 py-3 text-sm font-medium text-success">
                  <Check className="size-4" aria-hidden /> {t("calendarConnected")}
                </p>
              ) : (
                <Button
                  className="mt-5 w-full"
                  size="lg"
                  loading={connecting}
                  onClick={startCalendarConnect}
                >
                  {connecting ? t("openingGoogle") : t("connectCalendar")}
                </Button>
              )}
              <div className="mt-3 flex justify-between">
                <button
                  onClick={next}
                  className="cursor-pointer text-sm text-ink-muted hover:text-navy"
                >
                  {t("skipForNow")}
                </button>
                {calendarConnected && (
                  <Button size="sm" variant="ghost" onClick={next}>
                    {t("continueArrow")}
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* 5 · First action */}
          {step === 4 && (
            <Card className="p-8">
              <h1 className="text-2xl font-semibold tracking-tight text-navy">
                {t("tryTitle")}
              </h1>
              <div className="mt-5 flex gap-2">
                <input
                  value={tryText}
                  onChange={(e) => setTryText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendFirstRequest()}
                  aria-label={t("tryLabel")}
                  className="h-11 flex-1 rounded-control border border-line bg-white px-3.5 text-[15px] text-navy"
                />
                <Button
                  onClick={sendFirstRequest}
                  loading={trying}
                  aria-label={t("send")}
                >
                  <Send className="size-4" aria-hidden />
                </Button>
              </div>
              {tryReply && (
                <div className="mt-4 rounded-xl border border-line bg-soft p-4">
                  <p className="text-sm text-navy">{tryReply}</p>
                </div>
              )}
              <div className="mt-6 rounded-xl bg-whatsapp-bubble/60 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-navy">
                  <MessageCircle
                    className="size-4 text-whatsapp"
                    aria-hidden
                  />
                  {t("preferWhatsApp")}
                </p>
                <a
                  href={waLink("app")}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-umami-event="cta-start-whatsapp"
                  data-umami-event-placement="onboarding"
                  className="mt-2 inline-block text-sm font-semibold text-whatsapp hover:underline"
                >
                  {t("openWhatsApp")}
                </a>
              </div>
              <Button className="mt-6 w-full" size="lg" onClick={finishToApp}>
                {t("goDashboard")}
              </Button>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
