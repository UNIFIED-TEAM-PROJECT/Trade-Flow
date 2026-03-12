import { PageHeading } from "@/components/modules/page-heading";
import { SettingsPanel } from "@/components/modules/settings-panel";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Settings & Branding"
        description="Manage organisation profile, white-label branding, team invites, and notification rules."
      />
      <SettingsPanel />
      <ResourceManager
        title="Notifications"
        endpoint="notifications"
        compact
        fields={[
          { name: "userId", label: "User ID", required: true },
          { name: "type", label: "Type", required: true },
          { name: "title", label: "Title", required: true },
          { name: "message", label: "Message", type: "textarea", required: true },
          { name: "link", label: "Link" },
        ]}
      />
    </div>
  );
}
