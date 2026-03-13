import { MarketplaceBrowser } from "@/components/modules/marketplace-browser";
import { PageHeading } from "@/components/modules/page-heading";

export default function CustomerMarketplacePage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Marketplace"
        description="Browse contractor-supplied products for planned works and include them in your service requests."
      />
      <MarketplaceBrowser managerMode={false} />
    </div>
  );
}
