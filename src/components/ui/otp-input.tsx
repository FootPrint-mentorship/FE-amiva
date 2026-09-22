"use client";

import { useRef } from "react";

/** Six-box OTP input with auto-advance and paste support. */
export function OtpInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const setChar = (i: number, ch: string) => {
    const chars = value.padEnd(6, " ").split("");
    chars[i] = ch || " ";
    onChange(chars.join("").trimEnd());
  };

  /** Write `digits` from box `start` onwards, overflowing into the boxes after
   *  it, then park focus on the next empty box. */
  const fillFrom = (start: number, digits: string) => {
    const chars = value.padEnd(6, " ").split("");
    for (let k = 0; k < digits.length && start + k < 6; k++) {
      chars[start + k] = digits[k];
    }
    onChange(chars.join("").trimEnd());
    refs.current[Math.min(start + digits.length, 5)]?.focus();
  };

  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          // A box must be able to RECEIVE more than one digit: SMS/email
          // autofill and fast typing both deliver several digits in a single
          // input event, and maxLength={1} silently dropped everything after
          // the first. The controlled value still renders one digit per box.
          maxLength={6}
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`${label} digit ${i + 1}`}
          value={value[i]?.trim() ?? ""}
          onChange={(e) => {
            let digits = e.target.value.replace(/\D/g, "");
            const had = value[i]?.trim() ?? "";
            // A filled box yields "old+new" on the next keystroke — drop the
            // old digit so a retype replaces it instead of shifting the code.
            if (had && digits.length > 1 && digits.startsWith(had)) {
              digits = digits.slice(1);
            }
            if (!digits) {
              setChar(i, "");
              return;
            }
            fillFrom(i, digits);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i]?.trim() && i > 0) {
              refs.current[i - 1]?.focus();
            }
          }}
          onPaste={(e) => {
            e.preventDefault();
            const digits = e.clipboardData
              .getData("text")
              .replace(/\D/g, "")
              .slice(0, 6);
            if (digits) {
              onChange(digits);
              refs.current[Math.min(digits.length, 5)]?.focus();
            }
          }}
          className="size-12 rounded-control border border-line bg-white text-center text-lg font-semibold text-navy focus:border-indigo-300"
        />
      ))}
    </div>
  );
}
