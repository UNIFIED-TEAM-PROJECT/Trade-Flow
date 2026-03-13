import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "blue" | "orange" | "green";
}) {
  return (
    <Card
      className={cn(
        "overflow-hidden",
        highlight === "blue" && "border-t-4 border-t-tf-electric",
        highlight === "orange" && "border-t-4 border-t-tf-orange",
        highlight === "green" && "border-t-4 border-t-emerald-500",
      )}
    >
      <CardContent className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-display text-2xl font-semibold text-white">{value}</p>
      </CardContent>
    </Card>
  );
}
