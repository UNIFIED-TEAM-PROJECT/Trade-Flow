import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Customers"
        description="Manage homeowner and landlord customer profiles, subscriber flags, and contact records."
      />
      <ResourceManager
        title="Customer Directory"
        endpoint="customers"
        subtitle="Customer-facing app accounts and office-managed customer records."
        fields={[
          { name: "displayName", label: "Name", required: true },
          { name: "email", label: "Email", required: true },
          { name: "phone", label: "Phone" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
