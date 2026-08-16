import Image from "next/image";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/marketing/reveal";

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
        // pointer-events-auto: the wrapper is pointer-events-none, which
        // otherwise makes the hover scale and title tooltip unreachable.
        "animate-node-float pointer-events-auto absolute z-[3] flex h-15.5 w-15.5 min-h-0 items-center justify-center rounded-2xl border border-line bg-white shadow-[0_13px_30px_rgba(32,24,91,0.12)] transition-transform hover:scale-110",
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
      <div className="pointer-events-none absolute inset-0 mx-auto max-w-280">
        {/* Only shipped integrations appear here — logos join as they land.
            The layout breathes fine with two; spread them symmetrically. */}
        <IntegNode
          name="WhatsApp"
          logoSrc="/logos/whatsapp.svg"
          tilt={-8}
          delay={0}
          className="left-[14%] top-[18%]"
        />
        <IntegNode
          name="Google Calendar"
          logoSrc="/logos/google-calendar.svg"
          tilt={5}
          delay={0.4}
          className="right-[14%] top-[18%]"
        />

        {/* Decorative Arcs */}
        <div className="absolute top-[31%] left-[11%] h-25 w-45 rotate-[17deg] rounded-t-full border-t border-[#aaa5bf]" />
        <div className="absolute top-[33%] right-[14%] h-25 w-45 rotate-[58deg] rounded-t-full border-t border-[#aaa5bf]" />
        <div className="absolute bottom-[22%] right-[24%] h-25 w-45 -rotate-[20deg] rounded-t-full border-t border-[#aaa5bf]" />
      </div>

      {/* Centered message */}
      <Reveal className="relative z-[4] mx-auto w-[min(620px,88%)] pt-[205px] text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-500">
          Integrations
        </span>
        <h2 className="mt-3 text-[clamp(40px,4.7vw,60px)] font-bold leading-[1.02] tracking-[-0.055em] text-navy">
          Works with the tools{" "}
          <span className="font-semibold text-violet-500">you already use</span>
        </h2>
      </Reveal>

      {/* Principles footer */}
      <div className="absolute bottom-7.5 left-1/2 z-[4] grid w-[min(720px,88%)] -translate-x-1/2 grid-cols-2 gap-5 border-t border-[#dfdce8] pt-5 text-[10px] uppercase tracking-[0.08em] text-[#777487]">
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
