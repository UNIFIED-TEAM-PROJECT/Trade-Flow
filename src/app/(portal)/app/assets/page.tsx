import { AssetRegisterPanel } from "@/components/modules/asset-register-panel";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function AssetsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Property Asset Register"
        description="Track installed products by property/room, warranty windows, lifecycle status, and replacement opportunities."
      />
      <AssetRegisterPanel managerMode />
      <div className="grid gap-4 xl:grid-cols-2">
        <ResourceManager
          title="Asset Documents"
          endpoint="asset-documents"
          fields={[
            { name: "assetId", label: "Asset ID", required: true },
            { name: "fileName", label: "File Name", required: true },
            { name: "filePath", label: "File Path", required: true },
          ]}
        />
        <ResourceManager
          title="Asset Status History"
          endpoint="asset-status-history"
          fields={[
            { name: "assetId", label: "Asset ID", required: true },
            { name: "toStatus", label: "To Status", required: true },
            { name: "note", label: "Note" },
          ]}
        />
      </div>
    </div>
  );
}
