import { prisma } from "@/lib/db";
import { getAnalyticsOverview } from "@/lib/analytics";
import { requireSession } from "@/lib/server-session";
import { formatMoney } from "@/lib/utils";
import { PageHeading } from "@/components/modules/page-heading";
import { MetricCard } from "@/components/modules/metric-card";
import { TrendChart } from "@/components/modules/trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { membership } = await requireSession();
  const orgId = membership?.organisationId;
  if (!orgId) {
    return null;
  }

  const [dashboard, analytics, lowStockItems, vans] = await Promise.all([
    prisma.job.count({
      where: {
        organisationId: orgId,
        status: { in: ["SCHEDULED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"] },
      },
    }),
    getAnalyticsOverview(orgId),
    prisma.inventoryItem.findMany({
      where: { organisationId: orgId },
      select: { name: true, quantity: true, reorderLevel: true },
      take: 20,
      orderBy: { quantity: "asc" },
    }),
    prisma.van.findMany({
      where: { organisationId: orgId },
      select: { id: true, name: true, status: true, currentLocationLabel: true },
    }),
  ]);

  const flaggedItems = lowStockItems.filter((item) => item.quantity <= item.reorderLevel);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Company Dashboard"
        description="Live operations view for jobs, field teams, stock, finance, and SLA performance."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Active Jobs" value={dashboard} highlight="blue" />
        <MetricCard label="Revenue" value={formatMoney(analytics.revenue)} highlight="green" />
        <MetricCard label="Outstanding Invoices" value={formatMoney(analytics.outstanding)} highlight="orange" />
        <MetricCard label="Active Subscribers" value={analytics.activeSubscriptions} />
        <MetricCard label="Low Stock Alerts" value={analytics.lowStockCount} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue and Activity Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={analytics.trend.slice(-20)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {vans.map((van) => (
              <div key={van.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-2">
                <div>
                  <p className="text-sm font-medium">{van.name}</p>
                  <p className="text-xs text-slate-500">{van.currentLocationLabel ?? "Location pending"}</p>
                </div>
                <Badge variant={van.status === "ACTIVE" ? "success" : "warning"}>{van.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {flaggedItems.slice(0, 10).map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-lg bg-slate-50 p-2 text-sm">
                <span>{item.name}</span>
                <span className="font-medium text-red-600">
                  {item.quantity} / reorder {item.reorderLevel}
                </span>
              </div>
            ))}
            {flaggedItems.length === 0 ? (
              <p className="text-sm text-slate-500">No low stock alerts right now.</p>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Job Status Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {Object.entries(analytics.jobsByStatus).map(([status, value]) => (
              <div key={status} className="flex items-center justify-between rounded-lg border border-slate-100 p-2">
                <span className="text-slate-600">{status.replaceAll("_", " ")}</span>
                <span className="font-semibold">{value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
