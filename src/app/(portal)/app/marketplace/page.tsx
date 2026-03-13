import { MarketplaceBrowser } from "@/components/modules/marketplace-browser";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function MarketplacePage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Marketplace & Markup Engine"
        description="Manage supplier-backed product catalogue, markup rules, and contractor-branded product supply options."
      />
      <MarketplaceBrowser managerMode />
      <div className="grid gap-4 xl:grid-cols-2">
        <ResourceManager
          title="Product Categories"
          endpoint="product-categories"
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "slug", label: "Slug", required: true },
            { name: "description", label: "Description" },
            { name: "isActive", label: "Active" },
          ]}
        />
        <ResourceManager
          title="Markup Rules"
          endpoint="markup-rules"
          fields={[
            { name: "ruleName", label: "Rule Name", required: true },
            { name: "categoryId", label: "Category ID" },
            { name: "productId", label: "Product ID" },
            { name: "markupPct", label: "Markup %", type: "number", required: true },
            { name: "minimumMarginPct", label: "Min Margin %", type: "number" },
            { name: "roundingRule", label: "Rounding Rule" },
          ]}
        />
      </div>
    </div>
  );
}
