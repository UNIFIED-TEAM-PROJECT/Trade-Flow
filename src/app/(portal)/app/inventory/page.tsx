import { InventoryTools } from "@/components/modules/inventory-tools";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Inventory Control"
        description="Van-level inventory with racks/slots, supplier links, reorder thresholds, and stock movement history."
      />
      <InventoryTools />
      <div className="grid gap-4 xl:grid-cols-2">
        <ResourceManager
          title="Inventory Items"
          endpoint="inventory-items"
          fields={[
            { name: "name", label: "Item Name", required: true },
            { name: "sku", label: "SKU", required: true },
            { name: "category", label: "Category" },
            { name: "quantity", label: "Quantity", type: "number", required: true },
            { name: "reorderLevel", label: "Reorder Level", type: "number" },
            { name: "barcode", label: "Barcode" },
            { name: "qrCode", label: "QR Code" },
            { name: "slotId", label: "Slot ID" },
            { name: "vanId", label: "Van ID" },
          ]}
        />
        <ResourceManager
          title="Stock Movements"
          endpoint="stock-movements"
          subtitle="IN / OUT / TRANSFER actions captured for audit and valuation."
          fields={[
            { name: "inventoryItemId", label: "Inventory Item ID", required: true },
            { name: "type", label: "Movement Type", required: true },
            { name: "quantity", label: "Quantity", type: "number", required: true },
            { name: "jobId", label: "Job ID" },
            { name: "codeUsed", label: "Code Used" },
            { name: "note", label: "Note", type: "textarea" },
          ]}
        />
      </div>
    </div>
  );
}
