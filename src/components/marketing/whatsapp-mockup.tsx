import Image from "next/image";
import { CalendarDays, AlarmClock } from "lucide-react";

/** Floating stat card overlaid on the hero phone */
function FloatCard({
  icon: Icon,
  label,
  value,
  className,
  style,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden
      className={`absolute z-[3] flex items-center gap-2.5 rounded-2xl border border-white/80 bg-white/95 px-3.5 py-3 text-[10px] shadow-[0_18px_45px_rgba(11,8,35,0.2)] backdrop-blur-md ${className ?? ""}`}
      style={style}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-indigo-50">
        <Icon className="size-4 text-violet-500" />
      </span>
      <span className="flex flex-col gap-0.5">
        <b className="text-[11px] font-semibold text-navy">{value}</b>
        <span className="text-[#888997]">{label}</span>
      </span>
    </div>
  );
}

/** Hero phone visual — iPhone image with purple glow backdrop + float cards */
export function WhatsAppMockup() {
  return (
    <div
      aria-hidden
      className="relative flex h-[500px] min-w-0 items-center justify-center sm:h-[570px]"
    >
      {/* Soft orbit glow */}
      <div className="absolute size-[min(510px,92vw)] rounded-full bg-[radial-gradient(circle,rgba(87,199,220,0.18),rgba(97,90,167,0.1)_43%,transparent_69%)] blur-[5px] animate-orbit" />

      {/* Purple box behind phone */}
      <div className="absolute z-[1] h-[440px] w-[min(350px,82vw)] rounded-[48px] bg-gradient-to-br from-[#332568] via-[#4b378d] to-[#6150a7] shadow-[0_30px_70px_rgba(32,24,91,0.2)] sm:h-[500px] sm:rounded-[58px]" />

      {/* iPhone image */}
      <Image
        src="/brand/iPhone Amiva_Hero.png"
        alt=""
        width={286}
        height={590}
        priority
        className="hero-phone relative z-[2] h-[500px] w-auto animate-float sm:h-auto"
        style={{
          filter: "drop-shadow(0 30px 50px rgba(32,24,91,0.2))",
          objectFit: "contain",
        }}
      />

      {/* Floating cards */}
      <FloatCard
        icon={AlarmClock}
        label="Reminder set"
        value="Pay rent — Fri 9 AM"
        className="left-0 top-[150px] animate-slide-in sm:left-[-10px] sm:top-[170px]"
        style={{ animationDelay: "0.4s" }}
      />
      <FloatCard
        icon={CalendarDays}
        label="Next event"
        value="Standup — 9:30 AM"
        className="bottom-[70px] right-0 animate-slide-in sm:bottom-[105px] sm:right-[-12px]"
        style={{ animationDelay: "0.6s" }}
      />
    </div>
  );
}
