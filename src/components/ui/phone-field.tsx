"use client";

import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { RequiredMark } from "@/components/ui/field";

export const countryCodes = [
  { value: "+234", label: "Nigeria", hint: "+234" },
  { value: "+254", label: "Kenya", hint: "+254" },
  { value: "+233", label: "Ghana", hint: "+233" },
  { value: "+27", label: "South Africa", hint: "+27" },
  { value: "+255", label: "Tanzania", hint: "+255" },
  { value: "+256", label: "Uganda", hint: "+256" },
  { value: "+250", label: "Rwanda", hint: "+250" },
  { value: "+20", label: "Egypt", hint: "+20" },
  { value: "+212", label: "Morocco", hint: "+212" },
  { value: "+225", label: "Côte d'Ivoire", hint: "+225" },
  { value: "+237", label: "Cameroon", hint: "+237" },
  { value: "+251", label: "Ethiopia", hint: "+251" },
  { value: "+44", label: "United Kingdom", hint: "+44" },
  { value: "+1", label: "United States / Canada", hint: "+1" },
  { value: "+33", label: "France", hint: "+33" },
  { value: "+49", label: "Germany", hint: "+49" },
  { value: "+971", label: "United Arab Emirates", hint: "+971" },
  { value: "+91", label: "India", hint: "+91" },
];

/** Country-code Select + digits-only number input (item: numeric only). */
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
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-navy">{label}{required && <RequiredMark />}</p>
      <div className="flex gap-2">
        <Select
          label="Country code"
          value={cc}
          onChange={onCcChange}
          options={countryCodes.map((c) => ({
            value: c.value,
            label: c.hint,
            hint: c.label,
          }))}
          searchable
          hideHintInTrigger
          className="w-28 shrink-0"
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
