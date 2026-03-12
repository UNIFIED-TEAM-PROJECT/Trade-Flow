import { EstimateActions } from "@/components/modules/estimate-actions";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function EstimatesPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Estimates & Quotes"
        description="Build labour/material estimate documents with VAT and customer approval workflow."
      />
      <EstimateActions />
      <ResourceManager
        title="Estimates"
        endpoint="estimates"
        fields={[
          { name: "customerId", label: "Customer ID", required: true },
          { name: "propertyId", label: "Property ID" },
          { name: "jobId", label: "Job ID" },
          { name: "number", label: "Estimate Number", required: true },
          { name: "status", label: "Status", required: true },
          { name: "subtotal", label: "Subtotal", type: "number", required: true },
          { name: "vatTotal", label: "VAT", type: "number", required: true },
          { name: "total", label: "Total", type: "number", required: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
