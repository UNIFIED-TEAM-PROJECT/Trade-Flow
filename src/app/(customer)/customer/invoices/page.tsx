import { InvoiceActions } from "@/components/modules/invoice-actions";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function CustomerInvoicesPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Invoices & Payments"
        description="Review issued invoices, payment status, and complete mock payment flow."
      />
      <ResourceManager
        title="My Invoices"
        endpoint="invoices"
        compact
        fields={[
          { name: "number", label: "Invoice Number", required: true },
          { name: "status", label: "Status", required: true },
          { name: "subtotal", label: "Subtotal", type: "number", required: true },
          { name: "vatTotal", label: "VAT", type: "number", required: true },
          { name: "total", label: "Total", type: "number", required: true },
        ]}
      />
      <InvoiceActions />
    </div>
  );
}
