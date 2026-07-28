"use client";

import { useId, useState, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";

/** Password input with a show/hide toggle (item: all password inputs get one). */
export function PasswordField({
  label,
  hint,
  error,
  className,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
          className={cn(
            "h-11 w-full rounded-[10px] border bg-white pl-3.5 pr-11 text-[15px] text-navy placeholder:text-ink-muted",
            error ? "border-danger" : "border-line"
          )}
          {...input}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-ink-muted hover:bg-indigo-50 hover:text-navy"
        >
          {visible ? <EyeOff className="size-4.5" aria-hidden /> : <Eye className="size-4.5" aria-hidden />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-xs text-danger">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
