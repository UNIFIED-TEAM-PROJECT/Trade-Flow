import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function TechnicianHomePage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Today"
        description="View assigned schedule, track jobs in progress, and manage same-day field updates."
      />
      <ResourceManager
        title="Assigned Jobs"
        endpoint="jobs"
        compact
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "issueCategory", label: "Category", required: true },
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "status", label: "Status", required: true },
        ]}
      />
    </div>
  );
}
