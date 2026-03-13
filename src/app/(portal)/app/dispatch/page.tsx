import { DispatchCentrePanel } from "@/components/modules/dispatch-centre";
import { FleetMapPanel } from "@/components/modules/fleet-map-panel";
import { PageHeading } from "@/components/modules/page-heading";

export default function DispatchPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Dispatch Centre"
        description="Operational control room for incoming requests, SLA-risk subscribers, emergency dispatch, technician availability, and van readiness."
      />
      <DispatchCentrePanel />
      <FleetMapPanel />
    </div>
  );
}
