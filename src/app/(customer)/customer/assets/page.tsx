import { AssetRegisterPanel } from "@/components/modules/asset-register-panel";
import { PageHeading } from "@/components/modules/page-heading";

export default function CustomerAssetsPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Property Assets"
        description="Review installed products by room, track warranties, and request repair or replacement directly from each asset."
      />
      <AssetRegisterPanel managerMode={false} />
    </div>
  );
}
