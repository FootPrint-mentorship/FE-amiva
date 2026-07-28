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
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { settingsStore } from "@/lib/stores";

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
  const settings = useStore(settingsStore);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const { matrix, quietHours, tone } = settings;
  const setTone = (t: typeof settings.tone) => settingsStore.set((c) => ({ ...c, tone: t }));
  const setQuietHours = (fn: (q: boolean) => boolean) =>
    settingsStore.set((c) => ({ ...c, quietHours: fn(c.quietHours) }));

  const toggleCell = (row: string, ch: string) => {
    if (ch === "Push") return; // mobile app is Release 2
    settingsStore.set((c) => ({
      ...c,
      matrix: {
        ...c.matrix,
        [row]: c.matrix[row].includes(ch)
          ? c.matrix[row].filter((x) => x !== ch)
          : [...c.matrix[row], ch],
      },
    }));
  };

  const save = () => toast("Saved. Your preferences are up to date.");

  const setIntegration = (key: "whatsapp" | "calendar" | "gmail", on: boolean) =>
    settingsStore.set((c) => ({
      ...c,
      integrations: { ...c.integrations, [key]: on },
    }));

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
        <Card className="max-w-140 space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              value={settings.fullName}
              onChange={(e) => settingsStore.set((c) => ({ ...c, fullName: e.target.value }))}
            />
            <Field
              label="Preferred name"
              value={settings.preferredName}
              onChange={(e) => settingsStore.set((c) => ({ ...c, preferredName: e.target.value }))}
              hint="What Amiva calls you"
            />
          </div>
          <Field label="Email" defaultValue="ada@example.com" disabled hint="Contact support to change your email" />
          <Field label="Phone" defaultValue="+234 801 234 5678" disabled hint="Linked to your WhatsApp. Manage it under Integrations" />
          <div>
            <p className="mb-1.5 text-sm font-medium text-navy">Timezone</p>
            <select
              value={settings.timezone}
              onChange={(e) => settingsStore.set((c) => ({ ...c, timezone: e.target.value }))}
              className="h-11 w-full rounded-[10px] border border-line bg-white px-3 text-[15px] text-navy"
            >
              {["Africa/Lagos", "Africa/Nairobi", "Africa/Accra", "Africa/Johannesburg"].map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Amiva&apos;s tone</p>
            <div className="flex w-fit gap-1 rounded-xl bg-indigo-50 p-1">
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
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Appearance</p>
            <div className="flex w-fit gap-1 rounded-xl bg-indigo-50 p-1">
              {(["system", "light", "dark"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => settingsStore.set((c) => ({ ...c, theme: t }))}
                  aria-pressed={settings.theme === t}
                  className={cn(
                    "cursor-pointer rounded-[9px] px-4 py-1.5 text-sm font-medium capitalize transition-colors",
                    settings.theme === t
                      ? "bg-white text-indigo-900 shadow-card"
                      : "text-ink-muted hover:text-navy"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">System follows your device setting.</p>
          </div>
          <Button onClick={save}>Save changes</Button>
        </Card>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <Card className="max-w-160 p-6">
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
          <Button className="mt-6" onClick={save}>Save preferences</Button>
        </Card>
      )}

      {/* Integrations */}
      {tab === "integrations" && (
        <div className="max-w-160 space-y-3">
          {(
            [
              {
                key: "whatsapp" as const,
                icon: MessageCircle,
                name: "WhatsApp",
                detail: "+234 801 •••• 678",
                offDetail: "Link the number you chat from",
                disconnectLabel: "Unlink",
                consequence: "Amiva stops replying on WhatsApp until you link a number again.",
              },
              {
                key: "calendar" as const,
                icon: CalendarDays,
                name: "Google Calendar",
                detail: "ada@gmail.com · 2 calendars selected",
                offDetail: "Events, conflict checks and agenda summaries",
                disconnectLabel: "Disconnect",
                consequence: "Calendar features stop working and Amiva loses access to your events immediately.",
              },
              {
                key: "gmail" as const,
                icon: Mail,
                name: "Gmail",
                detail: "ada@gmail.com · inbox summaries active",
                offDetail: "Summaries, drafts and follow-ups",
                disconnectLabel: "Disconnect",
                consequence: "Email summaries and drafts stop working and access is revoked immediately.",
              },
            ]
          ).map((i) => {
            const on = settings.integrations[i.key];
            return (
              <Card key={i.name} className="flex items-center gap-4 p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50">
                  <i.icon className="size-5 text-indigo-900" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-semibold text-navy">
                    {i.name}
                    {on && <Chip tone="success">Connected</Chip>}
                  </p>
                  <p className="text-sm text-ink-muted">{on ? i.detail : i.offDetail}</p>
                </div>
                {on ? (
                  <Button variant="ghost" size="sm" onClick={() => setDisconnecting(i.key)}>
                    {i.disconnectLabel}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => {
                      setIntegration(i.key, true);
                      toast(`${i.name} connected.`);
                    }}
                  >
                    Connect
                  </Button>
                )}
              </Card>
            );
          })}
          <p className="text-xs text-ink-muted">
            Disconnecting revokes Amiva&apos;s access immediately. Features that depend on the integration stop working until you reconnect.
          </p>

          {disconnecting && (
            <Modal label="Confirm disconnect" onClose={() => setDisconnecting(null)} panelClassName="w-full max-w-110">
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-navy">
                  Disconnect {disconnecting === "whatsapp" ? "WhatsApp" : disconnecting === "calendar" ? "Google Calendar" : "Gmail"}?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {disconnecting === "whatsapp"
                    ? "Amiva stops replying on WhatsApp until you link a number again."
                    : disconnecting === "calendar"
                    ? "Calendar features stop working and Amiva loses access to your events immediately."
                    : "Email summaries and drafts stop working and access is revoked immediately."}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setDisconnecting(null)}>
                    Keep it connected
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      setIntegration(disconnecting as "whatsapp" | "calendar" | "gmail", false);
                      setDisconnecting(null);
                      toast("Disconnected. Access was revoked.", { tone: "info" });
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              </Card>
            </Modal>
          )}
        </div>
      )}

      {/* Security */}
      {tab === "security" && (
        <div className="max-w-160 space-y-4">
          <Card className="p-6">
            <p className="font-semibold text-navy">Password &amp; MFA</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast("Password changes arrive with live accounts.", { tone: "info" })}
              >
                Change password
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => toast("Two-factor setup arrives with live accounts.", { tone: "info" })}
              >
                Set up two-factor authentication
              </Button>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast("Signed out on that device.", { tone: "info" })}
                    >
                      Sign out
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Privacy */}
      {tab === "privacy" && (
        <div className="max-w-160 space-y-4">
          <Card className="p-6">
            <p className="font-semibold text-navy">Your data</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Memories", 7],
                ["Reminders", 5],
                ["Tasks", 3],
                ["Lists", 4],
              ].map(([k, n]) => (
                <div key={k} className="rounded-xl bg-soft p-3 text-center">
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
