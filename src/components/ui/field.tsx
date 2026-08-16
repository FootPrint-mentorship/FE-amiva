import { cn } from "@/lib/cn";
import { InputHTMLAttributes, useId } from "react";

/** Red asterisk marking a required field — one shared rendering so every
 * form marks requiredness the same way. aria-hidden: the native `required`
 * attribute already announces it, and extra label text would break the
 * field's accessible name. */
export function RequiredMark() {
  return (
    <span aria-hidden className="ml-0.5 text-danger">
      *
    </span>
  );
}

export function Field({
  label,
  hint,
  error,
  className,
  required,
  ...input
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline">
        <label htmlFor={id} className="text-sm font-medium text-navy">
          {label}
        </label>
        {required && <RequiredMark />}
      </div>
      <input
        id={id}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined}
        className={cn(
          "h-11 w-full rounded-control border bg-white px-3.5 text-[15px] text-navy placeholder:text-ink-muted",
          error ? "border-danger" : "border-line focus:border-indigo-300",
        )}
        {...input}
      />
      {error ? (
        <p id={`${id}-err`} className="mt-1 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
