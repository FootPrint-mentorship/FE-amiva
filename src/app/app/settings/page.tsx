"use client";

import { useState } from "react";
import {
  UserRound,
  Bell,
  Plug,
  ShieldCheck,
  Lock,
  MessageCircle,
  CalendarDays,
  Mail,
  Check,
  Download,
  Trash2,
  Laptop,
  Smartphone,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { user } from "@/lib/mock";

const tabs = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: Lock },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
] as const;

type TabId = (typeof tabs)[number]["id"];

const notifRows = ["Reminders", "Tasks", "Daily agenda", "Product updates"] as const;
const notifChannels = ["WhatsApp", "Email", "Push"] as const;

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("profile");
  const [tone, setTone] = useState<"Neutral" | "Warm" | "Formal" | "Brief">("Warm");
  const [matrix, setMatrix] = useState<Record<string, string[]>>({
    Reminders: ["WhatsApp", "Email"],
    Tasks: ["WhatsApp"],
    "Daily agenda": ["WhatsApp"],
    "Product updates": ["Email"],
  });
  const [quietHours, setQuietHours] = useState(true);
  const [saved, setSaved] = useState(false);

  const toggleCell = (row: string, ch: string) => {
    if (ch === "Push") return; // mobile app is Release 2
    setMatrix((m) => ({
      ...m,
      [row]: m[row].includes(ch) ? m[row].filter((x) => x !== ch) : [...m[row], ch],
    }));
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-semibold tracking-tight text-navy">Settings</h1>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={cn(
              "flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "bg-indigo-900 text-white"
                : "border border-line bg-white text-ink-muted hover:border-indigo-300"
            )}
          >
            <t.icon className="size-4" aria-hidden />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {tab === "profile" && (
        <Card className="max-w-[560px] space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" defaultValue="Ada Obi" />
            <Field label="Preferred name" defaultValue={user.preferred_name} hint="What Amiva calls you" />
          </div>
          <Field label="Email" defaultValue="ada@example.com" disabled hint="Contact support to change your email" />
          <Field label="Phone" defaultValue="+234 801 234 5678" disabled hint="Linked to your WhatsApp. Manage it under Integrations" />
          <div>
            <p className="mb-1.5 text-sm font-medium text-navy">Timezone</p>
            <select defaultValue={user.timezone} className="h-11 w-full rounded-[10px] border border-line bg-white px-3 text-[15px] text-navy">
              {["Africa/Lagos", "Africa/Nairobi", "Africa/Accra", "Africa/Johannesburg"].map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Amiva&apos;s tone</p>
            <div className="flex w-fit gap-1 rounded-[12px] bg-indigo-50 p-1">
              {(["Neutral", "Warm", "Formal", "Brief"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  aria-pressed={tone === t}
                  className={cn(
                    "cursor-pointer rounded-[9px] px-4 py-1.5 text-sm font-medium transition-colors",
                    tone === t ? "bg-white text-indigo-900 shadow-card" : "text-ink-muted hover:text-navy"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <Button onClick={save}>{saved ? "Saved ✓" : "Save changes"}</Button>
        </Card>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <Card className="max-w-[640px] p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-muted">
                <th className="pb-3 font-semibold">Notify me about</th>
                {notifChannels.map((c) => (
                  <th key={c} className="pb-3 text-center font-semibold">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {notifRows.map((row) => (
                <tr key={row} className="border-t border-line">
                  <td className="py-3 font-medium text-navy">{row}</td>
                  {notifChannels.map((ch) => {
                    const on = matrix[row].includes(ch);
                    const disabled = ch === "Push";
                    return (
                      <td key={ch} className="py-3 text-center">
                        <button
                          aria-label={`${row} via ${ch}: ${on ? "on" : "off"}`}
                          disabled={disabled}
                          title={disabled ? "Mobile app coming soon" : undefined}
                          onClick={() => toggleCell(row, ch)}
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-md border-2 transition-colors",
                            disabled
                              ? "cursor-not-allowed border-line bg-soft"
                              : on
                              ? "cursor-pointer border-indigo-900 bg-indigo-900 text-white"
                              : "cursor-pointer border-indigo-200 hover:border-indigo-900"
                          )}
                        >
                          {on && !disabled && <Check className="size-4" aria-hidden />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 border-t border-line pt-5">
            <label className="flex cursor-pointer items-center justify-between">
              <span>
                <span className="block text-sm font-medium text-navy">Quiet hours</span>
                <span className="text-xs text-ink-muted">22:00 – 07:00 · urgent reminders still come through</span>
              </span>
              <button
                role="switch"
                aria-checked={quietHours}
                onClick={() => setQuietHours((q) => !q)}
                className={cn(
                  "h-6 w-11 cursor-pointer rounded-full p-0.5 transition-colors",
                  quietHours ? "bg-indigo-900" : "bg-line"
                )}
              >
                <span
                  className={cn(
                    "block size-5 rounded-full bg-white shadow-card transition-transform",
                    quietHours && "translate-x-5"
                  )}
                />
              </button>
            </label>
          </div>
          <Button className="mt-6" onClick={save}>{saved ? "Saved ✓" : "Save preferences"}</Button>
        </Card>
      )}

      {/* Integrations */}
      {tab === "integrations" && (
        <div className="max-w-[640px] space-y-3">
          {[
            {
              icon: MessageCircle,
              name: "WhatsApp",
              detail: "+234 801 •••• 678 · linked",
              status: "connected",
              action: "Unlink",
            },
            {
              icon: CalendarDays,
              name: "Google Calendar",
              detail: "ada@gmail.com · 2 calendars selected",
              status: "connected",
              action: "Disconnect",
            },
            {
              icon: Mail,
              name: "Gmail",
              detail: "Summaries, drafts and follow-ups",
              status: "not connected",
              action: "Connect",
            },
          ].map((i) => (
            <Card key={i.name} className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-[12px] bg-indigo-50">
                <i.icon className="size-5 text-indigo-900" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-semibold text-navy">
                  {i.name}
                  {i.status === "connected" && <Chip tone="success">Connected</Chip>}
                </p>
                <p className="text-sm text-ink-muted">{i.detail}</p>
              </div>
              <Button variant={i.status === "connected" ? "ghost" : "primary"} size="sm">
                {i.action}
              </Button>
            </Card>
          ))}
          <p className="text-xs text-ink-muted">
            Disconnecting revokes Amiva&apos;s access immediately. Features that depend on the integration stop working until you reconnect.
          </p>
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="max-w-[640px] space-y-4">
          <Card className="p-6">
            <p className="font-semibold text-navy">Password &amp; MFA</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">Change password</Button>
              <Button variant="secondary" size="sm">Set up two-factor authentication</Button>
            </div>
          </Card>
          <Card className="p-6">
            <p className="mb-3 font-semibold text-navy">Active sessions</p>
            <div className="space-y-3">
              {[
                { icon: Laptop, label: "MacBook · Lagos", meta: "This device · active now" },
                { icon: Smartphone, label: "iPhone · Lagos", meta: "Last active 2 hours ago" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <s.icon className="size-4.5 text-ink-muted" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-navy">{s.label}</p>
                    <p className="text-xs text-ink-muted">{s.meta}</p>
                  </div>
                  {!s.meta.startsWith("This") && (
                    <Button variant="ghost" size="sm">Sign out</Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Privacy */}
      {tab === "privacy" && (
        <div className="max-w-[640px] space-y-4">
          <Card className="p-6">
            <p className="font-semibold text-navy">Your data</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Memories", 7],
                ["Reminders", 5],
                ["Tasks", 3],
                ["Lists", 4],
              ].map(([k, n]) => (
                <div key={k} className="rounded-[12px] bg-soft p-3 text-center">
                  <p className="text-xl font-bold tabular-nums text-navy">{n}</p>
                  <p className="text-xs text-ink-muted">{k}</p>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="mt-4">
              <Download className="size-4" aria-hidden />
              Export all my data
            </Button>
            <p className="mt-2 text-xs text-ink-muted">
              A complete JSON export, ready within a few minutes. Link valid for 24 hours.
            </p>
          </Card>
          <Card className="border-danger/30 p-6">
            <p className="font-semibold text-danger">Danger zone</p>
            <p className="mt-1 text-sm text-ink-muted">
              Deleting your account revokes all provider access immediately and
              permanently removes your data after a 14-day grace period.
            </p>
            <Button variant="danger" size="sm" className="mt-4">
              <Trash2 className="size-4" aria-hidden />
              Delete my account
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
