import { Card } from "@/components/ui/card";
import { Hammer } from "lucide-react";

/** Stub screen for modules that are specced but not yet built. */
export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="space-y-5">
      <h1 className="text-[28px] font-semibold tracking-tight text-navy">{title}</h1>
      <Card className="flex flex-col items-center gap-3 p-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-[14px] bg-indigo-50">
          <Hammer className="size-6 text-violet-500" aria-hidden />
        </span>
        <p className="font-medium text-navy">In design</p>
        <p className="max-w-[380px] text-sm leading-relaxed text-ink-muted">{note}</p>
      </Card>
    </div>
  );
}
