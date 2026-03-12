import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function FleetPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Fleet Management"
        description="Manage van profiles, assignments, route placeholders, rack layouts, and fleet readiness."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <ResourceManager
          title="Vans"
          endpoint="vans"
          fields={[
            { name: "name", label: "Van Name", required: true },
            { name: "registration", label: "Registration", required: true },
            { name: "identifier", label: "Identifier", required: true },
            { name: "assignedTechnicianId", label: "Technician ID" },
            { name: "depotLocation", label: "Depot" },
            { name: "currentLocationLabel", label: "Current Location" },
          ]}
        />
        <ResourceManager
          title="Racks"
          endpoint="racks"
          fields={[
            { name: "vanId", label: "Van ID", required: true },
            { name: "label", label: "Rack Label", required: true },
            { name: "description", label: "Description" },
          ]}
        />
      </div>
      <ResourceManager
        title="Slots"
        endpoint="slots"
        subtitle="Rack/slot hierarchy supports custom van stock maps."
        fields={[
          { name: "rackId", label: "Rack ID", required: true },
          { name: "label", label: "Slot Label", required: true },
          { name: "category", label: "Category" },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Map & Allocation Placeholder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600">
          <p>Map integration is abstracted for future provider plugins (Google, Mapbox, or OpenStreetMap).</p>
          <p>Current MVP uses internal proximity logic from stored van coordinates and job locations.</p>
          <p>
            Allocation suggestion rule: nearest active van with sufficient stock and technician capacity is ranked
            first.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
