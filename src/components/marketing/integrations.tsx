import Image from "next/image";
import { cn } from "@/lib/cn";

interface NodeProps {
  logoSrc: string;
  name: string;
  className?: string;
  tilt?: number;
  delay?: number;
}

function IntegNode({
  logoSrc,
  name,
  className,
  tilt = 0,
  delay = 0,
}: NodeProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-node-float absolute z-[3] flex h-[62px] w-[62px] min-h-0 items-center justify-center rounded-2xl border border-line bg-white shadow-[0_13px_30px_rgba(32,24,91,0.12)] transition-transform hover:scale-110",
        className
      )}
      style={
        {
          "--tilt": `${tilt}deg`,
          transform: `rotate(${tilt}deg)`,
          animationDelay: `${delay}s`,
        } as React.CSSProperties
      }
      title={name}
    >
      <Image
        src={logoSrc}
        alt={name}
        width={36}
        height={36}
        className="size-9 object-contain"
      />
    </div>
  );
}

/** Floating integration nodes band — uses actual scraped company logos and no Amiva logo */
export function IntegrationsChaos() {
  return (
    <section
      className="relative overflow-hidden border-y border-[#eceaf3] bg-[#f8f7fb]"
      style={{ minHeight: 680 }}
    >
      {/* Orbit container */}
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-[1120px]">
        {/* Company Floating Logo Nodes */}
        <IntegNode
          name="WhatsApp"
          logoSrc="/logos/whatsapp.svg"
          tilt={-8}
          delay={0}
          className="left-[7%] top-[21%]"
        />
        <IntegNode
          name="Google Calendar"
          logoSrc="/logos/google-calendar.svg"
          tilt={5}
          delay={0.4}
          className="left-[32%] top-[9%]"
        />
        <IntegNode
          name="Gmail"
          logoSrc="/logos/gmail.svg"
          tilt={8}
          delay={0.8}
          className="right-[10%] top-[20%]"
        />
        <IntegNode
          name="Google Drive"
          logoSrc="/logos/google-drive.svg"
          tilt={-7}
          delay={0.2}
          className="bottom-[17%] left-[14%]"
        />
        <IntegNode
          name="Slack"
          logoSrc="/logos/slack.svg"
          tilt={8}
          delay={0.6}
          className="bottom-[18%] right-[14%]"
        />
        <IntegNode
          name="Notion"
          logoSrc="/logos/notion.svg"
          tilt={-4}
          delay={0.3}
          className="right-[32%] top-[10%]"
        />
        <IntegNode
          name="Zoom"
          logoSrc="/logos/zoom.svg"
          tilt={6}
          delay={0.7}
          className="bottom-[10%] left-[36%]"
        />
        <IntegNode
          name="Telegram"
          logoSrc="/logos/telegram.svg"
          tilt={-5}
          delay={0.9}
          className="bottom-[10%] right-[36%]"
        />

        {/* Decorative Arcs */}
        <div className="absolute top-[31%] left-[11%] h-[100px] w-[180px] rotate-[17deg] rounded-t-full border-t border-[#aaa5bf]" />
        <div className="absolute top-[33%] right-[14%] h-[100px] w-[180px] rotate-[58deg] rounded-t-full border-t border-[#aaa5bf]" />
        <div className="absolute bottom-[22%] right-[24%] h-[100px] w-[180px] -rotate-[20deg] rounded-t-full border-t border-[#aaa5bf]" />
      </div>

      {/* Centered message */}
      <div className="relative z-[4] mx-auto w-[min(620px,88%)] pt-[205px] text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-500">
          Integrations
        </span>
        <h2 className="mt-3 text-[clamp(40px,4.7vw,60px)] font-bold leading-[1.02] tracking-[-0.055em] text-navy">
          Works with the tools{" "}
          <span className="font-semibold text-violet-500">you already use</span>
        </h2>
      </div>

      {/* Principles footer */}
      <div className="absolute bottom-[30px] left-1/2 z-[4] grid w-[min(720px,88%)] -translate-x-1/2 grid-cols-2 gap-5 border-t border-[#dfdce8] pt-5 text-[10px] uppercase tracking-[0.08em] text-[#777487]">
        <span>End-to-end encrypted</span>
        <a
          href="/privacy-policy"
          className="inline-flex items-center justify-center gap-1.5 font-bold text-indigo-900"
        >
          Privacy details →
        </a>
      </div>
    </section>
  );
}
