"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendChart } from "@/components/modules/trend-chart";
import { formatMoney } from "@/lib/utils";

type AnalyticsData = {
  revenue: number;
  outstanding: number;
  activeSubscriptions: number;
  lowStockCount: number;
  averageEstimateValue: number;
  estimateConversionRate: number;
  jobsByStatus: Record<string, number>;
  technicianLoad: Record<string, number>;
  trend: Array<{ metric: string; value: number; capturedAt: string }>;
};

export function AnalyticsPanel() {
  const query = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: async () => apiFetch<{ data: AnalyticsData }>("/api/analytics/overview"),
  });

  const data = query.data?.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>{formatMoney(data?.revenue ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding</CardTitle>
          </CardHeader>
          <CardContent>{formatMoney(data?.outstanding ?? 0)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Estimate Conversion</CardTitle>
          </CardHeader>
          <CardContent>{(data?.estimateConversionRate ?? 0).toFixed(1)}%</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Estimate Value</CardTitle>
          </CardHeader>
          <CardContent>{formatMoney(data?.averageEstimateValue ?? 0)}</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={(data?.trend ?? []).slice(-30)} />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jobs by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(data?.jobsByStatus ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-md bg-slate-50 p-2">
                <span>{key.replaceAll("_", " ")}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Technician Workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(data?.technicianLoad ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-md bg-slate-50 p-2">
                <span>{key}</span>
                <span className="font-medium">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
