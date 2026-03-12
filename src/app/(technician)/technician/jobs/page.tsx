import { JobOperationsPanel } from "@/components/modules/job-operations";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function TechnicianJobsPage() {
  return (
    <div className="space-y-4">
      <PageHeading title="Job Actions" description="Start, complete, and update assigned jobs from the field." />
      <JobOperationsPanel />
      <ResourceManager
        title="My Jobs"
        endpoint="jobs"
        fields={[
          { name: "title", label: "Title", required: true },
          { name: "issueCategory", label: "Category", required: true },
          { name: "description", label: "Description", type: "textarea", required: true },
          { name: "status", label: "Status", required: true },
          { name: "labourMinutes", label: "Labour Minutes", type: "number" },
        ]}
      />
    </div>
  );
}
