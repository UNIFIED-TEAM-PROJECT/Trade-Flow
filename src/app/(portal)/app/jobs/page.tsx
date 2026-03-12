import { JobOperationsPanel } from "@/components/modules/job-operations";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Job Management"
        description="Track full job lifecycle from intake and estimate through completion, invoice, and warranty follow-up."
      />
      <JobOperationsPanel />
      <ResourceManager
        title="Jobs"
        endpoint="jobs"
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
