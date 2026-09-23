"use client";

import { useMemo } from "react";
import { Select, type SelectOption } from "@/components/ui/select";
import { allCountries } from "@/lib/country-codes";
import { cn } from "@/lib/cn";
import { RequiredMark } from "@/components/ui/field";

/** Launch markets + common diaspora, pinned to the top of the list — the
 * full 248-country list (lib/country-codes.ts) follows alphabetically and
 * is always one search away. */
const POPULAR_ISO = [
  "NG", "KE", "GH", "ZA", "TZ", "UG", "RW", "EG", "MA", "CI", "CM", "ET",
  "GB", "US", "FR", "DE", "AE", "IN",
];

/** ISO-3166 alpha-2 → flag emoji (regional indicator pair) — no data table. */
function flag(iso: string): string {
  return String.fromCodePoint(...[...iso].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

/** Country name in the viewer's own language when the browser can; the
 * dataset's English name otherwise. */
function displayName(iso: string, english: string): string {
  try {
    return new Intl.DisplayNames(undefined, { type: "region" }).of(iso) ?? english;
  } catch {
    return english;
  }
}

function buildOptions(): SelectOption[] {
  const byIso = new Map(allCountries.map((c) => [c.iso, c]));
  const popular = POPULAR_ISO.map((iso) => byIso.get(iso)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );
  const rest = allCountries.filter((c) => !POPULAR_ISO.includes(c.iso));
  return [...popular, ...rest].map((c) => ({
    value: c.iso,
    label: `${flag(c.iso)} ${displayName(c.iso, c.name)}`,
    hint: c.dial,
    triggerLabel: `${flag(c.iso)} ${c.dial}`,
  }));
}

/** Country-code Select + digits-only number input (item: numeric only).
 * The public contract stays the DIAL STRING (`cc`, e.g. "+234") — that's
 * what buildE164 consumes — while the Select is keyed by ISO code, since
 * several countries share a dial code (+1, +44, +7…). Mapping a dial back
 * to a country picks the first match (popular list wins), which only
 * affects which row shows the checkmark, never the number built. */
export function PhoneField({
  required,
  label = "WhatsApp phone number",
  cc,
  phone,
  onCcChange,
  onPhoneChange,
  hint,
  error,
}: {
  required?: boolean;
  label?: string;
  cc: string;
  phone: string;
  onCcChange: (cc: string) => void;
  onPhoneChange: (digits: string) => void;
  hint?: string;
  error?: string;
}) {
  const options = useMemo(() => buildOptions(), []);
  const selectedIso = options.find((o) => o.hint === cc)?.value ?? null;
  const dialByIso = (iso: string) =>
    allCountries.find((c) => c.iso === iso)?.dial ?? cc;

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-navy">{label}{required && <RequiredMark />}</p>
      <div className="flex gap-2">
        <Select
          label="Country code"
          value={selectedIso}
          onChange={(iso) => onCcChange(dialByIso(iso))}
          options={options}
          searchable
          hideHintInTrigger
          className="w-32 shrink-0"
        />
        <input
          aria-label="Phone number"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="8012345678"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, ""))}
          className={cn(
            "h-11 min-w-0 flex-1 rounded-control border bg-white px-3.5 text-[15px] tabular-nums text-navy placeholder:text-ink-muted",
            error ? "border-danger" : "border-line",
          )}
        />
      </div>
      {error ? (
        <p className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
