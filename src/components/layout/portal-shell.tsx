"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  BarChart3,
  Building2,
  Bot,
  Calculator,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  MapPinned,
  Menu,
  MessageSquare,
  Package,
  Route,
  Settings,
  ShieldCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useUiStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PortalUser = {
  firstName: string;
  lastName: string;
  role: "OWNER" | "MANAGER" | "TECHNICIAN" | "CUSTOMER" | null;
  organisationName?: string;
};

const NAV_ITEMS = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/dispatch", label: "Dispatch", icon: MapPinned, roles: ["OWNER", "MANAGER"] },
  { href: "/app/incoming", label: "Incoming", icon: LifeBuoy, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/customers", label: "Customers", icon: Users, roles: ["OWNER", "MANAGER"] },
  { href: "/app/properties", label: "Properties", icon: Building2, roles: ["OWNER", "MANAGER"] },
  { href: "/app/jobs", label: "Jobs", icon: ClipboardList, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/fleet", label: "Fleet", icon: Route, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/inventory", label: "Inventory", icon: Package, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/estimates", label: "Estimates", icon: Wrench, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/invoices", label: "Invoices", icon: CreditCard, roles: ["OWNER", "MANAGER"] },
  { href: "/app/subscriptions", label: "Plans", icon: ShieldCheck, roles: ["OWNER", "MANAGER"] },
  { href: "/app/chat", label: "Chat", icon: MessageSquare, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/accounting", label: "Accounting", icon: Calculator, roles: ["OWNER", "MANAGER"] },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3, roles: ["OWNER", "MANAGER"] },
  { href: "/app/marketplace", label: "Marketplace", icon: Boxes, roles: ["OWNER", "MANAGER"] },
  { href: "/app/assets", label: "Assets", icon: Building2, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/assistant", label: "AI Assistant", icon: Bot, roles: ["OWNER", "MANAGER", "TECHNICIAN"] },
  { href: "/app/settings", label: "Settings", icon: Settings, roles: ["OWNER", "MANAGER"] },
];

function UserMenu({ user }: { user: PortalUser }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="rounded-lg border border-white/20 bg-white/10 p-3 text-white">
      <p className="font-medium">{`${user.firstName} ${user.lastName}`}</p>
      <p className="text-xs text-white/80">{user.organisationName ?? "TradesFlow"}</p>
      <Button className="mt-3 w-full bg-white/20 hover:bg-white/30" onClick={signOut}>
        Sign out
      </Button>
    </div>
  );
}

export function PortalShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: PortalUser;
}) {
  const pathname = usePathname();
  const { mobileNavOpen, toggleMobileNav, closeMobileNav } = useUiStore();
  const filtered = NAV_ITEMS.filter((item) => user.role && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[#040812] text-slate-100">
      <div className="fixed left-0 top-0 z-20 hidden h-screen w-72 border-r border-white/10 bg-gradient-to-b from-[#081a2f] via-[#0a2040] to-[#081425] p-5 text-white lg:block">
        <div className="mb-6 border-b border-white/20 pb-4">
          <Image
            src="/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-light.svg"
            alt="TradesFlow"
            className="h-10 w-auto"
            width={220}
            height={40}
          />
        </div>
        <nav className="space-y-1">
          {filtered.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10",
                  active ? "bg-white/20" : "text-white/90",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6">
          <UserMenu user={user} />
        </div>
      </div>

      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/80 backdrop-blur lg:ml-72">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-6">
          <button
            onClick={toggleMobileNav}
            className="rounded-md border border-white/20 p-2 text-slate-200 lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-tf-orange/40 bg-tf-orange/15 px-3 py-1 text-xs font-medium text-tf-orange">
              TradesFlow MVP
            </span>
            <span className="hidden text-sm text-slate-300 sm:inline">Operational OS for field service teams</span>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-slate-100">{`${user.firstName} ${user.lastName}`}</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">{user.role ?? "USER"}</p>
          </div>
        </div>
      </header>

      <main className="px-4 pb-24 pt-6 lg:ml-72 lg:px-6">
        <div className="mx-auto max-w-[1600px]">{children}</div>
      </main>

      <div
        className={cn(
          "fixed inset-0 z-30 bg-black/40 transition lg:hidden",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={closeMobileNav}
      />
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-72 bg-gradient-to-b from-[#081a2f] via-[#0a2040] to-[#081425] p-5 text-white shadow-xl transition lg:hidden",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between border-b border-white/20 pb-4">
          <Image
            src="/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-light.svg"
            alt="TradesFlow"
            className="h-8 w-auto"
            width={180}
            height={32}
          />
          <button onClick={closeMobileNav} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1">
          {filtered.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10",
                  active ? "bg-white/20" : "text-white/90",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
