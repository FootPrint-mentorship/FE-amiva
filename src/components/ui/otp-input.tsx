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

  return (
    <div role="group" aria-label={label} className="flex gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          maxLength={1}
          aria-label={`${label} digit ${i + 1}`}
          value={value[i]?.trim() ?? ""}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            setChar(i, ch);
            if (ch && i < 5) refs.current[i + 1]?.focus();
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
