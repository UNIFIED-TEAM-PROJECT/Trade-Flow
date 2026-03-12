"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Package, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEM_SETS = {
  technician: [
    { href: "/technician", label: "Today", icon: Home },
    { href: "/technician/jobs", label: "Jobs", icon: Wrench },
    { href: "/technician/inventory", label: "Stock", icon: Package },
    { href: "/technician/chat", label: "Chat", icon: MessageSquare },
  ],
  customer: [
    { href: "/customer", label: "Home", icon: Home },
    { href: "/customer/jobs", label: "Jobs", icon: Wrench },
    { href: "/customer/invoices", label: "Invoices", icon: Package },
    { href: "/customer/chat", label: "Chat", icon: MessageSquare },
  ],
};

export function MobileBottomNav({ type }: { type: "technician" | "customer" }) {
  const pathname = usePathname();
  const items = ITEM_SETS[type];
  return (
    <nav className="fixed bottom-0 left-0 z-40 grid w-full grid-cols-4 border-t border-slate-200 bg-white lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 px-2 py-2 text-xs",
              active ? "text-tf-electric" : "text-slate-600",
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
