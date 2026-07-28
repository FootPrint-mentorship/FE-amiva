import Link from "next/link";
import { Logo } from "@/components/logo";
import { Year } from "@/components/year";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="hidden w-[42%] flex-col justify-between bg-gradient-to-b from-indigo-900 to-navy p-10 lg:flex">
        <Link href="/" aria-label="Amiva home">
          <Logo variant="light" size={32} />
        </Link>
        <div>
          <p className="max-w-90 text-3xl font-semibold leading-snug text-white">
            Manage your life and work from one conversation.
          </p>
          <p className="mt-4 max-w-90 text-white/60">
            Reminders, calendar, email and memory, handled by your personal
            chief of staff on WhatsApp.
          </p>
        </div>
        <p className="text-xs text-white/40">© <Year /> Amiva</p>
      </aside>

      {/* Form side */}
      <main className="flex flex-1 flex-col items-center justify-center bg-soft px-5 py-10">
        <Link href="/" className="mb-8 lg:hidden" aria-label="Amiva home">
          <Logo size={32} />
        </Link>
        <div className="w-full max-w-105">{children}</div>
      </main>
    </div>
  );
}
