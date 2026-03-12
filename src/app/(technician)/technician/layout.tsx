import { redirect } from "next/navigation";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { requireSession } from "@/lib/server-session";

export default async function TechnicianLayout({ children }: { children: React.ReactNode }) {
  const { membership } = await requireSession();
  if (!membership) {
    redirect("/login");
  }
  if (membership.role === "CUSTOMER") {
    redirect("/customer");
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <img
            src="/branding/tradesflow_svg_bundle/tradesflow-icon-only.svg"
            alt="TradesFlow"
            className="h-8 w-8"
          />
          <div>
            <p className="font-display text-lg font-semibold">Technician Workspace</p>
            <p className="text-xs text-slate-500">Mobile-first field operations view</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl p-4">{children}</main>
      <MobileBottomNav type="technician" />
    </div>
  );
}
