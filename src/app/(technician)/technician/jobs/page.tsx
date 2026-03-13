import { JobOperationsPanel } from "@/components/modules/job-operations";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";
import { TechnicianJobExecution } from "@/components/modules/technician-job-execution";

export default function TechnicianJobsPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Technician Execution Flow"
        description="Travel start, on-site work, material usage, photo capture placeholders, and completion handoff."
      />
      <TechnicianJobExecution />
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
