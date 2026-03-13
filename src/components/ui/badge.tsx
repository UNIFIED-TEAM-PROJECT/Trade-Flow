import { cn } from "@/lib/utils";

export function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variant === "default" && "border border-white/15 bg-slate-900/80 text-slate-200",
        variant === "success" && "border border-emerald-400/30 bg-emerald-500/15 text-emerald-200",
        variant === "warning" && "border border-amber-400/30 bg-amber-500/15 text-amber-200",
        variant === "danger" && "border border-red-400/30 bg-red-500/15 text-red-200",
      )}
    >
      {children}
    </span>
  );
}
