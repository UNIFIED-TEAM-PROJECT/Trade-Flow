"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { LocateFixed } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type IncomingQueue = Array<{
  id: string;
  title: string;
  urgency: string;
  property: { address: string };
  suggestion: {
    van: { vanId: string; vanName: string; readinessScore: number } | null;
    travelMinutes: number;
  };
}>;

type InventoryOverview = {
  vanOverview: Array<{
    vanId: string;
    vanName: string;
    registration: string;
    stockValue: number;
    lowStock: number;
    usageLast30Days: number;
  }>;
};

export function FleetAvailabilityPanel() {
  const incoming = useQuery({
    queryKey: ["fleet-incoming-requests"],
    queryFn: async () => apiFetch<{ data: IncomingQueue }>("/api/ops/incoming-jobs"),
  });

  const overview = useQuery({
    queryKey: ["fleet-inventory-overview"],
    queryFn: async () => apiFetch<{ data: InventoryOverview }>("/api/ops/inventory/overview"),
  });

  const nearestByVan = useMemo(() => {
    const queue = incoming.data?.data ?? [];
    const map = new Map<string, (typeof queue)[number]>();
    for (const request of queue) {
      const vanId = request.suggestion.van?.vanId;
      if (!vanId) {
        continue;
      }
      const existing = map.get(vanId);
      if (!existing || request.suggestion.travelMinutes < existing.suggestion.travelMinutes) {
        map.set(vanId, request);
      }
    }
    return map;
  }, [incoming.data?.data]);

  return (
    <Card className="border-white/15 bg-slate-950/80">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white">Fleet Availability and Route Signals</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(overview.data?.data.vanOverview ?? []).map((van) => {
          const nearest = nearestByVan.get(van.vanId);
          return (
            <div key={van.vanId} className="rounded-xl border border-white/10 bg-slate-900/55 p-3 text-sm">
              <p className="font-medium text-white">{van.vanName}</p>
              <p className="text-slate-300">{van.registration}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={van.lowStock > 2 ? "warning" : "success"}>
                  {van.lowStock > 2 ? "Low stock risk" : "Stock healthy"}
                </Badge>
                <Badge>{van.usageLast30Days} used</Badge>
              </div>
              <p className="mt-2 text-slate-300">Stock value GBP {van.stockValue.toFixed(2)}</p>
              {nearest ? (
                <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/70 p-2 text-xs text-slate-300">
                  <p className="flex items-center gap-1 text-white">
                    <LocateFixed className="h-3 w-3" /> Nearest incoming request
                  </p>
                  <p>{nearest.title}</p>
                  <p>{nearest.property.address}</p>
                  <p>
                    ETA {nearest.suggestion.travelMinutes} min | readiness {nearest.suggestion.van?.readinessScore ?? 0}%
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
