import { JobOperationsPanel } from "@/components/modules/job-operations";
import { IncomingRequestsBoard } from "@/components/modules/incoming-requests-board";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Job Management"
        description="Run intake review, accept/assign workflow, technician execution, invoice handoff, and warranty follow-up."
      />
      <IncomingRequestsBoard />
      <JobOperationsPanel />
      <ResourceManager
        title="Jobs"
        endpoint="jobs"
        subtitle="Operational job table with lifecycle states and assignment references."
        fields={[
          { name: "customerId", label: "Customer ID", required: true },
          { name: "propertyId", label: "Property ID", required: true },
          { name: "title", label: "Title", required: true },
          { name: "issueCategory", label: "Category", required: true },
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "urgency", label: "Urgency" },
          { name: "status", label: "Status" },
          { name: "scheduledAt", label: "Scheduled At", type: "datetime-local" },
        ]}
      />
    </div>
  );
}
