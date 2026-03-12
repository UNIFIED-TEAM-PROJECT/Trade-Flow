import { InvoiceActions } from "@/components/modules/invoice-actions";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Invoices"
        description="Generate branded invoices, track payment state, and maintain full invoice history."
      />
      <InvoiceActions />
      <ResourceManager
        title="Invoices"
        endpoint="invoices"
        fields={[
          { name: "customerId", label: "Customer ID", required: true },
          { name: "propertyId", label: "Property ID" },
          { name: "jobId", label: "Job ID" },
          { name: "number", label: "Invoice Number", required: true },
          { name: "status", label: "Status", required: true },
          { name: "subtotal", label: "Subtotal", type: "number", required: true },
          { name: "vatTotal", label: "VAT", type: "number", required: true },
          { name: "total", label: "Total", type: "number", required: true },
          { name: "dueAt", label: "Due Date", type: "datetime-local" },
        ]}
      />
    </div>
  );
}
