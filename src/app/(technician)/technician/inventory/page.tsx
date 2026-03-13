import { InventoryTools } from "@/components/modules/inventory-tools";
import { InventoryLogisticsPanel } from "@/components/modules/inventory-logistics-panel";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function TechnicianInventoryPage() {
  return (
    <div className="space-y-4">
      <PageHeading title="Van Inventory" description="Scan or manually enter codes to log stock usage on jobs." />
      <InventoryTools />
      <InventoryLogisticsPanel compact />
      <ResourceManager
        title="Van Stock"
        endpoint="inventory-items"
        compact
        fields={[
          { name: "name", label: "Name", required: true },
          { name: "sku", label: "SKU", required: true },
          { name: "quantity", label: "Quantity", type: "number", required: true },
          { name: "barcode", label: "Barcode" },
          { name: "slotId", label: "Slot ID" },
        ]}
      />
    </div>
  );
}
