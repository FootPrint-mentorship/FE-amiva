import Image from "next/image";

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="ml-auto max-w-[78%] rounded-xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-[13px] leading-snug text-[#111b21] shadow-sm">
      {children}
      <span className="mt-0.5 block text-right text-[10px] text-[#667781]">
        09:41 ✓✓
      </span>
    </div>
  );
}

function AmivaBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="mr-auto max-w-[82%] rounded-xl rounded-tl-sm bg-white px-3 py-2 text-[13px] leading-snug text-[#111b21] shadow-sm">
      {children}
      <span className="mt-0.5 block text-right text-[10px] text-[#667781]">
        09:41
      </span>
    </div>
  );
}

/** DOM-built phone mockup of an Amiva conversation — no screenshot assets. */
export function WhatsAppMockup() {
  return (
    <div
      aria-hidden
      className="mx-auto w-[300px] rounded-[38px] border-[10px] border-navy bg-navy shadow-pop"
    >
      <div className="overflow-hidden rounded-[28px]">
        {/* chat header */}
        <div className="flex items-center gap-2.5 bg-[#075e54] px-3 py-2.5 text-white">
          <Image
            src="/brand/mark.svg"
            alt=""
            width={30}
            height={30}
            className="rounded-full bg-white/10"
          />
          <div className="leading-tight">
            <p className="text-[13.5px] font-semibold">Amiva</p>
            <p className="text-[10.5px] text-white/75">online</p>
          </div>
        </div>
        {/* thread */}
        <div className="flex min-h-[380px] flex-col gap-2 bg-[#ece5dd] p-3">
          <UserBubble>Remind me to pay rent on Friday morning</UserBubble>
          <AmivaBubble>
            ⏰ Done — I&apos;ll remind you <b>Fri 31 Jul, 9:00 AM (WAT)</b>:
            <br />
            “Pay rent”
          </AmivaBubble>
          <UserBubble>what does my thursday look like?</UserBubble>
          <AmivaBubble>
            You have <b>2 meetings</b> on Thursday: Standup 9:30 AM and
            Investor sync 1:00 PM. Your afternoon is free — want me to block
            focus time?
          </AmivaBubble>
          <UserBubble>remember my landlord&apos;s account is GTB 0123456789</UserBubble>
          <AmivaBubble>
            💾 Saved under <b>Finance</b>. Just ask me “landlord account”
            whenever you need it.
          </AmivaBubble>
        </div>
      </div>
    </div>
  );
}
