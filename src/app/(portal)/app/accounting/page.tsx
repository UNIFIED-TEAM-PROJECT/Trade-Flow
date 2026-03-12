import { AccountingPanel } from "@/components/modules/accounting-panel";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function AccountingPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Accounting & VAT"
        description="Track invoices and expenses with VAT-ready reporting, ledger entries, and receipt records."
      />
      <AccountingPanel />
      <div className="grid gap-4 xl:grid-cols-2">
        <ResourceManager
          title="Expenses"
          endpoint="expenses"
          fields={[
            { name: "category", label: "Category", required: true },
            { name: "description", label: "Description", required: true },
            { name: "amount", label: "Amount", type: "number", required: true },
            { name: "vatAmount", label: "VAT Amount", type: "number" },
            { name: "supplierId", label: "Supplier ID" },
            { name: "occurredAt", label: "Occurred At", type: "datetime-local" },
          ]}
        />
        <ResourceManager
          title="VAT Periods"
          endpoint="vat-periods"
          fields={[
            { name: "quarterLabel", label: "Quarter", required: true },
            { name: "startDate", label: "Start Date", type: "datetime-local", required: true },
            { name: "endDate", label: "End Date", type: "datetime-local", required: true },
            { name: "salesVat", label: "Sales VAT", type: "number", required: true },
            { name: "purchaseVat", label: "Purchase VAT", type: "number", required: true },
            { name: "netVat", label: "Net VAT", type: "number", required: true },
          ]}
        />
      </div>
    </div>
  );
}
