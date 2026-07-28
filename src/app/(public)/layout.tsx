import Link from "next/link";
import { Logo } from "@/components/logo";
import { BrandPanel } from "@/components/brand-panel";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <BrandPanel />
      <main className="flex flex-1 flex-col items-center justify-center bg-soft px-5 py-10">
        <Link href="/" className="mb-8 lg:hidden" aria-label="Amiva home">
          <Logo size={32} />
        </Link>
        <div className="w-full max-w-105">{children}</div>
      </main>
    </div>
  );
}
