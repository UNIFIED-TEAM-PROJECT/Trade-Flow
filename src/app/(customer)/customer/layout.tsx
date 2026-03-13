import { redirect } from "next/navigation";
import Image from "next/image";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { requireSession } from "@/lib/server-session";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { membership } = await requireSession();
  if (!membership) {
    redirect("/login");
  }
  if (membership.role !== "CUSTOMER") {
    redirect("/app/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#040812] pb-20 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Image
            src="/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-light.svg"
            alt="TradesFlow"
            className="h-8 w-auto"
            width={180}
            height={32}
          />
          <div>
            <p className="font-display text-lg font-semibold text-slate-100">Customer Portal</p>
            <p className="text-xs text-slate-400">Book jobs, approve estimates, and track invoices.</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4">{children}</main>
      <MobileBottomNav type="customer" />
    </div>
  );
}
