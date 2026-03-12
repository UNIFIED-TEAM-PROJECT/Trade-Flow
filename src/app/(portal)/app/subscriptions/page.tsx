import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function SubscriptionsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Protection Plans"
        description="Configure customer subscription plans and track active SLA-backed members."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <ResourceManager
          title="Subscription Plans"
          endpoint="subscription-plans"
          fields={[
            { name: "name", label: "Plan Name", required: true },
            { name: "monthlyPrice", label: "Monthly Price", type: "number" },
            { name: "yearlyPrice", label: "Yearly Price", type: "number" },
            { name: "responseSlaHours", label: "SLA Hours", type: "number", required: true },
            { name: "discountedLabourPct", label: "Discount %", type: "number" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
        />
        <ResourceManager
          title="Customer Subscriptions"
          endpoint="subscriptions"
          fields={[
            { name: "customerId", label: "Customer ID", required: true },
            { name: "planId", label: "Plan ID", required: true },
            { name: "status", label: "Status", required: true },
            { name: "startDate", label: "Start Date", type: "datetime-local" },
            { name: "renewalDate", label: "Renewal Date", type: "datetime-local" },
            { name: "notes", label: "Notes", type: "textarea" },
          ]}
        />
      </div>
    </div>
  );
}
