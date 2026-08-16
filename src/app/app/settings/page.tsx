"use client";

import { useEffect, useState } from "react";
import {
  UserRound,
  Bell,
  Plug,
  ShieldCheck,
  Lock,
  MessageCircle,
  CalendarDays,
  Check,
  Download,
  Trash2,
  Laptop,
  Smartphone,
  History,
  ToggleLeft,
  BadgeCheck,
  MessageSquare,
  AlarmClock,
  CheckSquare,
  Brain,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { OtpInput } from "@/components/ui/otp-input";
import { toast } from "@/components/ui/toast";
import { ActivityLog } from "@/components/domain/activity-log";
import { cn } from "@/lib/cn";
import { useStore } from "@/lib/store";
import { settingsStore, type FeatureKey } from "@/lib/stores";
import { timezoneOptions } from "@/lib/timezones";
import {
  hydrateNotificationPrefs,
  saveFeature,
  saveNotificationPrefs,
  saveProfile,
  sendPhoneCode,
  verifyPhoneCode,
} from "@/lib/data/settings";
import {
  connectGoogle,
  hydrateIntegrations,
  integrationsStore,
  revokeIntegration,
} from "@/lib/data/integrations";
import {
  listSessions,
  revokeSession,
  requestPasswordReset,
  signOut as endSession,
  type SessionRow,
} from "@/lib/data/auth";
import { deleteAccount, privacyOverview, runExport, saveBlob, type DataCount } from "@/lib/data/privacy";
import { ApiError, USE_MOCKS } from "@/lib/api/client";
import { useRouter } from "next/navigation";

const tabs = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "features", label: "Features", icon: ToggleLeft },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "security", label: "Security", icon: Lock },
  { id: "activity", label: "Activity", icon: History },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
] as const;

type TabId = (typeof tabs)[number]["id"];

const KIND_LABEL: Record<string, string> = {
  memories: "Memories",
  reminders: "Reminders",
  tasks: "Tasks",
  messages: "Messages",
  calendar_events: "Events",
};

const notifRows = ["Reminders", "Tasks", "Daily agenda", "Product updates"] as const;
const notifChannels = ["WhatsApp", "Email", "Push"] as const;

const featureMeta: { key: FeatureKey; label: string; body: string; icon: typeof Brain }[] = [
  { key: "chat", label: "Chat", body: "Talk to Amiva from the web, not just WhatsApp.", icon: MessageSquare },
  { key: "reminders", label: "Reminders", body: "One-time and recurring reminders with delivery tracking.", icon: AlarmClock },
  { key: "calendar", label: "Calendar", body: "Google Calendar events, conflicts and free slots.", icon: CalendarDays },
  { key: "tasks", label: "Tasks", body: "Categorised tasks and checklists with subtasks.", icon: CheckSquare },
  { key: "memories", label: "Memories", body: "Your personal, searchable memory.", icon: Brain },
];

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "h-6 w-11 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors",
        on ? "bg-indigo-900" : "bg-line"
      )}
    >
      <span
        className={cn(
          "block size-5 rounded-full bg-white shadow-card transition-transform",
          on && "translate-x-5"
        )}
      />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("profile");
  const settings = useStore(settingsStore);
  const integrationRows = useStore(integrationsStore);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [counts, setCounts] = useState<DataCount[] | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { matrix, quietHours } = settings;

  // Security/Privacy tabs read from the server on first open.
  useEffect(() => {
    if (tab === "security" && sessions === null)
      listSessions().then(setSessions).catch(() => setSessions([]));
    if (tab === "privacy" && counts === null)
      privacyOverview().then(setCounts).catch(() => setCounts([]));
  }, [tab, sessions, counts]);

  // Real mode: the notifications matrix and integrations live on the server.
  useEffect(() => {
    hydrateNotificationPrefs().catch(() => {
      /* the store's defaults still render; saving will surface errors */
    });
    hydrateIntegrations().catch(() => {
      /* same: the cards fall back to the stored flags */
    });
  }, []);

  const saveFailed = () =>
    toast("Saving didn't go through — nothing was changed. Please try again.", {
      tone: "error",
    });

  const save = () =>
    saveProfile()
      .then(() => toast("Saved. Your preferences are up to date."))
      .catch(saveFailed);

  const savePrefs = () =>
    saveNotificationPrefs()
      .then(() => toast("Saved. Your preferences are up to date."))
      .catch(saveFailed);

  const toggleCell = (row: string, ch: string) => {
    if (ch === "Push") return; // mobile app is Release 2
    // §11.5 as amended: a linked WhatsApp IS the verified channel.
    if (ch === "WhatsApp" && !settings.integrations.whatsapp) return;
    if (ch === "Email" && !settings.emailVerified) return;
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

  const setIntegration = (key: "whatsapp" | "calendar", on: boolean) =>
    settingsStore.set((c) => ({
      ...c,
      integrations: { ...c.integrations, [key]: on },
    }));

  const startPhoneVerify = () => {
    setVerifyingPhone(true);
    sendPhoneCode().catch(() => {
      setVerifyingPhone(false);
      toast("Couldn't send the code just now. Please try again.", { tone: "error" });
    });
  };

  const onPhoneOtp = (code: string) => {
    setPhoneOtp(code);
    if (code.length === 6) {
      verifyPhoneCode(code)
        .then(() => {
          setVerifyingPhone(false);
          setPhoneOtp("");
          toast("Phone verified. WhatsApp delivery is live.");
        })
        .catch(() => {
          setPhoneOtp("");
          toast("That code didn't match. Please try again.", { tone: "error" });
        });
    }
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
          <div>
            <Field label="Email" value={settings.email} disabled onChange={() => {}} />
            <p className="mt-1 flex items-center gap-1.5 text-xs">
              {settings.emailVerified ? (
                <span className="flex items-center gap-1 font-medium text-success">
                  <BadgeCheck className="size-3.5" aria-hidden /> Verified
                </span>
              ) : (
                <span className="text-warning-ink">Not verified — check your inbox for the code.</span>
              )}
            </p>
          </div>
          <div>
            <Field label="Phone" value={settings.phone} disabled onChange={() => {}} />
            <p className="mt-1 flex items-center gap-2 text-xs">
              {settings.phoneVerified ? (
                <span className="flex items-center gap-1 font-medium text-success">
                  <BadgeCheck className="size-3.5" aria-hidden /> Verified
                </span>
              ) : (
                <>
                  <span className="text-warning-ink">
                    {settings.integrations.whatsapp
                      ? "Not verified."
                      : "Not verified, link WhatsApp to get reminders there."}
                  </span>
                  <button
                    onClick={startPhoneVerify}
                    className="cursor-pointer font-medium text-indigo-900 hover:underline"
                  >
                    Verify now
                  </button>
                </>
              )}
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-navy">Timezone</p>
            <Select
              label="Timezone"
              value={settings.timezone}
              onChange={(timezone) => settingsStore.set((c) => ({ ...c, timezone }))}
              options={timezoneOptions()}
              searchable
            />
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

      {/* Features */}
      {tab === "features" && (
        <Card className="max-w-160 p-6">
          <p className="mb-4 text-sm text-ink-muted">
            Switch off what you don&apos;t use. Disabled features leave the sidebar
            and Amiva stops offering them; nothing is deleted.
          </p>
          <div className="divide-y divide-line">
            {featureMeta.map((f) => (
              <div key={f.key} className="flex items-center gap-4 py-3.5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                  <f.icon className="size-5 text-indigo-900" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-navy">{f.label}</p>
                  <p className="text-xs text-ink-muted">{f.body}</p>
                </div>
                <Toggle
                  on={settings.features[f.key]}
                  label={`${f.label} feature`}
                  onChange={() => {
                    const turningOff = settings.features[f.key];
                    settingsStore.set((c) => ({
                      ...c,
                      features: { ...c.features, [f.key]: !c.features[f.key] },
                    }));
                    saveFeature(f.key, !turningOff)
                      .then(() =>
                        toast(
                          turningOff
                            ? `${f.label} switched off. Turn it back on any time.`
                            : `${f.label} switched on.`,
                          { tone: "info" }
                        )
                      )
                      .catch(() => {
                        // server said no — put the flag back
                        settingsStore.set((c) => ({
                          ...c,
                          features: { ...c.features, [f.key]: turningOff },
                        }));
                        saveFailed();
                      });
                  }}
                />
              </div>
            ))}
          </div>
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
                    const unverified =
                      (ch === "WhatsApp" && !settings.integrations.whatsapp) ||
                      (ch === "Email" && !settings.emailVerified);
                    const disabled = ch === "Push" || unverified;
                    return (
                      <td key={ch} className="py-3 text-center">
                        <button
                          aria-label={`${row} via ${ch}: ${on ? "on" : "off"}`}
                          disabled={disabled}
                          title={
                            ch === "Push"
                              ? "Mobile app coming soon"
                              : unverified
                              ? ch === "WhatsApp"
                                ? "Link WhatsApp to enable"
                                : "Verify your email to enable"
                              : undefined
                          }
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
          <p className="mt-3 text-xs text-ink-muted">
            Amiva never sends to a channel you haven&apos;t verified.
          </p>

          <div className="mt-6 border-t border-line pt-5">
            <label className="flex cursor-pointer items-center justify-between">
              <span>
                <span className="block text-sm font-medium text-navy">Quiet hours</span>
                <span className="text-xs text-ink-muted">22:00 – 07:00 · urgent reminders still come through</span>
              </span>
              <Toggle
                on={quietHours}
                label="Quiet hours"
                onChange={() => settingsStore.set((c) => ({ ...c, quietHours: !c.quietHours }))}
              />
            </label>
          </div>
          <Button className="mt-6" onClick={savePrefs}>Save preferences</Button>
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
                // The account's own phone — the wa_id itself can be a privacy
                // JID (…@lid), so the number on file is the honest display.
                detail: settings.phone || "Connected",
                offDetail: "Link the number you chat from",
                disconnectLabel: "Unlink",
              },
              {
                key: "calendar" as const,
                icon: CalendarDays,
                name: "Google Calendar",
                detail: "ada@gmail.com · 2 calendars selected",
                offDetail: "Events, conflict checks and agenda summaries",
                disconnectLabel: "Disconnect",
              },
            ]
          ).map((i) => {
            const on = settings.integrations[i.key];
            const row =
              i.key === "whatsapp"
                ? null
                : integrationRows.find(
                    (r) => r.status === "active" && r.scopes.includes(i.key)
                  );
            const detail = row ? `${row.account_email} · connected` : i.detail;
            const connect = () => {
              if (i.key === "whatsapp") {
                if (USE_MOCKS) {
                  setIntegration("whatsapp", true);
                  toast("WhatsApp connected.");
                } else {
                  router.push("/link"); // linking happens in WhatsApp itself
                }
                return;
              }
              connectGoogle(i.key).catch((err) =>
                toast(
                  err instanceof ApiError && err.code === "PROVIDER_ERROR"
                    ? "Google connections aren't configured on this server yet — nothing was changed."
                    : "That didn't go through — nothing was changed.",
                  { tone: "error" }
                )
              );
            };
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
                  <p className="text-sm text-ink-muted">{on ? detail : i.offDetail}</p>
                </div>
                {on ? (
                  <Button variant="ghost" size="sm" onClick={() => setDisconnecting(i.key)}>
                    {i.disconnectLabel}
                  </Button>
                ) : (
                  <Button size="sm" onClick={connect}>
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
                  Disconnect {disconnecting === "whatsapp" ? "WhatsApp" : "Google Calendar"}?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  {disconnecting === "whatsapp"
                    ? "Amiva stops replying on WhatsApp until you link a number again."
                    : "Calendar features stop working and Amiva loses access to your events immediately."}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setDisconnecting(null)}>
                    Keep it connected
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => {
                      const key = disconnecting as "whatsapp" | "calendar";
                      setDisconnecting(null);
                      if (key === "whatsapp") {
                        setIntegration("whatsapp", false);
                        toast("Disconnected. Access was revoked.", { tone: "info" });
                        return;
                      }
                      revokeIntegration(key)
                        .then(() => toast("Disconnected. Access was revoked.", { tone: "info" }))
                        .catch(() =>
                          toast("That didn't go through — access was not changed.", { tone: "error" })
                        );
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
            <p className="font-semibold text-navy">Password</p>
            <p className="mt-1 text-sm text-ink-muted">
              We&apos;ll email you a secure link to set a new password.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              onClick={() =>
                requestPasswordReset(settings.email)
                  .then(() => toast("Password reset link sent to your email."))
                  .catch(saveFailed)
              }
            >
              Change password
            </Button>
          </Card>
          <Card className="p-6">
            <p className="mb-3 font-semibold text-navy">Active sessions</p>
            {sessions === null ? (
              <p className="text-sm text-ink-muted">Loading sessions…</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-ink-muted">Couldn&apos;t load your sessions.</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => {
                  const mobile = /mobile|iphone|android/i.test(s.user_agent ?? "");
                  const Icon = mobile ? Smartphone : Laptop;
                  const label =
                    s.device_label ??
                    (s.user_agent ? s.user_agent.split(" ")[0].split("/")[0] : "Unknown device");
                  const meta = s.current
                    ? "This device · active now"
                    : `Last active ${new Date(s.last_used_at ?? s.created_at).toLocaleString()}`;
                  return (
                    <div key={s.id} className="flex items-center gap-3">
                      <Icon className="size-4.5 text-ink-muted" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy">
                          {label}
                          {s.ip ? <span className="font-normal text-ink-muted"> · {s.ip}</span> : null}
                        </p>
                        <p className="text-xs text-ink-muted">{meta}</p>
                      </div>
                      {!s.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            revokeSession(s.id)
                              .then(() => {
                                setSessions((cur) => (cur ?? []).filter((r) => r.id !== s.id));
                                toast("Signed out on that device.");
                              })
                              .catch(saveFailed)
                          }
                        >
                          Sign out
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Activity (moved here from the sidebar) */}
      {tab === "activity" && <ActivityLog />}

      {/* Privacy */}
      {tab === "privacy" && (
        <div className="max-w-160 space-y-4">
          <Card className="p-6">
            <p className="font-semibold text-navy">Your data</p>
            {counts === null ? (
              <p className="mt-3 text-sm text-ink-muted">Counting your data…</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {counts.map(({ kind, count }) => (
                  <div key={kind} className="rounded-xl bg-soft p-3 text-center">
                    <p className="text-xl font-bold tabular-nums text-navy">{count}</p>
                    <p className="text-xs text-ink-muted">{KIND_LABEL[kind] ?? kind}</p>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              loading={exporting}
              onClick={() => {
                setExporting(true);
                runExport()
                  .then((blob) => {
                    saveBlob(blob, "amiva-export.json");
                    toast("Your export has downloaded.");
                  })
                  .catch(saveFailed)
                  .finally(() => setExporting(false));
              }}
            >
              <Download className="size-4" aria-hidden />
              Export all my data
            </Button>
            <p className="mt-2 text-xs text-ink-muted">
              A complete JSON export of everything Amiva stores about you.
            </p>
          </Card>
          <Card className="border-danger/30 p-6">
            <p className="font-semibold text-danger">Danger zone</p>
            <p className="mt-1 text-sm text-ink-muted">
              Deleting your account revokes all provider access immediately and
              permanently removes your data after a 14-day grace period.
            </p>
            <Button variant="danger" size="sm" className="mt-4" onClick={() => setConfirmingDelete(true)}>
              <Trash2 className="size-4" aria-hidden />
              Delete my account
            </Button>
          </Card>

          {confirmingDelete && (
            <Modal
              label="Confirm account deletion"
              onClose={() => !deleting && setConfirmingDelete(false)}
              panelClassName="w-full max-w-110"
            >
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-navy">Delete your account?</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                  You&apos;ll be signed out everywhere right away. Your data is kept for a
                  14-day grace period — email support@tryamiva.com within that window to undo — and
                  is permanently deleted after it.
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
                    Keep my account
                  </Button>
                  <Button
                    variant="danger"
                    loading={deleting}
                    onClick={() => {
                      setDeleting(true);
                      deleteAccount()
                        .then((when) => {
                          toast(`Deletion scheduled for ${new Date(when).toLocaleDateString()}.`);
                          return endSession();
                        })
                        .then(() => router.replace("/login"))
                        .catch(() => {
                          setDeleting(false);
                          saveFailed();
                        });
                    }}
                  >
                    Delete my account
                  </Button>
                </div>
              </Card>
            </Modal>
          )}
        </div>
      )}

      {/* Phone verification modal */}
      {verifyingPhone && (
        <Modal label="Verify phone" onClose={() => setVerifyingPhone(false)} panelClassName="w-full max-w-110">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-navy">Verify your phone</h2>
            <p className="mt-2 text-sm text-ink-muted">
              We sent a 6-digit code to your WhatsApp number — nowhere else.
            </p>
            <div className="mt-4">
              <OtpInput value={phoneOtp} onChange={onPhoneOtp} label="Phone code" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4"
              onClick={() => setVerifyingPhone(false)}
            >
              Cancel
            </Button>
          </Card>
        </Modal>
      )}
    </div>
  );
}
