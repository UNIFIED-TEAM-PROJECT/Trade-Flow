import { AnalyticsPanel } from "@/components/modules/analytics-panel";
import { PageHeading } from "@/components/modules/page-heading";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Analytics"
        description="Revenue, job conversion, workload, stock pressure, and SLA performance from seeded and live data."
      />
      <AnalyticsPanel />
    </div>
  );
}
