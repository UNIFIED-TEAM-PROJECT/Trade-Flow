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
  estimateApprovalRate: number;
  vanUtilisationPct: number;
  stockUsageByVan: Record<string, number>;
  stockShrinkageLoss: number;
  profitableJobTypes: Array<{ category: string; total: number }>;
  slaCompliancePct: number;
  emergencyResponseMinutes: number;
  subscriptionRevenue: number;
  recurringCustomersCount: number;
  oneOffCustomersCount: number;
  productSalesByCategory: Array<{ category: string; total: number }>;
  grossMarginByProductCategory: Array<{ category: string; total: number }>;
  markupRevenue: number;
  installedAssetCount: number;
  assetsNearingWarrantyExpiry: number;
  replacementOpportunityPipeline: number;
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
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{formatMoney(data?.revenue ?? 0)}</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Outstanding</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{formatMoney(data?.outstanding ?? 0)}</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Estimate Approval</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{(data?.estimateApprovalRate ?? 0).toFixed(1)}%</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Avg Estimate Value</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{formatMoney(data?.averageEstimateValue ?? 0)}</CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Van Utilisation</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{(data?.vanUtilisationPct ?? 0).toFixed(1)}%</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">SLA Compliance</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{(data?.slaCompliancePct ?? 0).toFixed(1)}%</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Emergency Response</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{(data?.emergencyResponseMinutes ?? 0).toFixed(0)} min</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Subscription Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{formatMoney(data?.subscriptionRevenue ?? 0)}</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Shrinkage / Loss</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{formatMoney(data?.stockShrinkageLoss ?? 0)}</CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Markup Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{formatMoney(data?.markupRevenue ?? 0)}</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Installed Assets</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{data?.installedAssetCount ?? 0}</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Warranty Expiry (90d)</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{data?.assetsNearingWarrantyExpiry ?? 0}</CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Replacement Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="text-white">{data?.replacementOpportunityPipeline ?? 0}</CardContent>
        </Card>
      </div>
      <Card className="border-white/15 bg-slate-950/80">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={(data?.trend ?? []).slice(-30)} />
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Jobs by Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(data?.jobsByStatus ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-md bg-slate-900/60 p-2">
                <span className="text-slate-300">{key.replaceAll("_", " ")}</span>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Technician Workload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(data?.technicianLoad ?? {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between rounded-md bg-slate-900/60 p-2">
                <span className="text-slate-300">{key}</span>
                <span className="font-medium text-white">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Most Profitable Job Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.profitableJobTypes ?? []).map((entry) => (
              <div key={entry.category} className="flex items-center justify-between rounded-md bg-slate-900/60 p-2">
                <span className="text-slate-300">{entry.category}</span>
                <span className="font-medium text-white">{formatMoney(entry.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Customer Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <div className="rounded-md bg-slate-900/60 p-2">
              Recurring customers: <span className="font-medium text-white">{data?.recurringCustomersCount ?? 0}</span>
            </div>
            <div className="rounded-md bg-slate-900/60 p-2">
              One-off customers: <span className="font-medium text-white">{data?.oneOffCustomersCount ?? 0}</span>
            </div>
            <div className="rounded-md bg-slate-900/60 p-2">
              Low stock alerts: <span className="font-medium text-white">{data?.lowStockCount ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Product Sales by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.productSalesByCategory ?? []).map((entry) => (
              <div key={entry.category} className="flex items-center justify-between rounded-md bg-slate-900/60 p-2">
                <span className="text-slate-300">{entry.category}</span>
                <span className="font-medium text-white">{formatMoney(entry.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Gross Margin by Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {(data?.grossMarginByProductCategory ?? []).map((entry) => (
              <div key={entry.category} className="flex items-center justify-between rounded-md bg-slate-900/60 p-2">
                <span className="text-slate-300">{entry.category}</span>
                <span className="font-medium text-white">{formatMoney(entry.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
