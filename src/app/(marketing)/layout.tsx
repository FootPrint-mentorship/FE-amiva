import Link from "next/link";
import { Logo } from "@/components/logo";
import { WA_LINK } from "@/lib/site";
import { MessageCircle } from "lucide-react";
import { Year } from "@/components/year";

const nav = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1140px] items-center justify-between px-5">
          <Link href="/" aria-label="Amiva home">
            <Logo size={30} />
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-ink-muted md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-navy">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-[10px] px-4 text-sm font-medium text-indigo-900 hover:bg-indigo-50 sm:inline-flex"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-9 items-center rounded-[10px] bg-indigo-900 px-4 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-navy text-white">
        <div className="mx-auto grid w-full max-w-[1140px] gap-10 px-5 py-14 md:grid-cols-4">
          <div className="space-y-3">
            <Logo variant="light" size={28} />
            <p className="max-w-[220px] text-sm text-white/60">
              Your personal chief of staff, on WhatsApp.
            </p>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white/80">Product</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/#features" className="hover:text-white">Features</Link></li>
              <li><Link href="/#pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link href="/#faq" className="hover:text-white">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-sm font-semibold text-white/80">Legal</p>
            <ul className="space-y-2 text-sm text-white/60">
              <li><Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-white/80">Talk to Amiva</p>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-cyan-500 px-4 text-sm font-semibold text-navy hover:bg-cyan-400"
            >
              <MessageCircle className="size-4" aria-hidden />
              Open WhatsApp
            </a>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-white/40">
          © <Year /> Amiva. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
