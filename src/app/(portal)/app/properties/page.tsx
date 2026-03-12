import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Properties"
        description="Digital property records with service history context, warranty notes, and compliance placeholders."
      />
      <ResourceManager
        title="Property Records"
        endpoint="properties"
        subtitle="Link each property to customers and preserve long-term maintenance context."
        fields={[
          { name: "customerId", label: "Customer ID", required: true },
          { name: "label", label: "Property Label" },
          { name: "addressLine1", label: "Address Line 1", required: true },
          { name: "city", label: "City", required: true },
          { name: "postcode", label: "Postcode", required: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
