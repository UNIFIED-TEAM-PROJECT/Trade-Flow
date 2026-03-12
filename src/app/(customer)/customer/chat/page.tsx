import { ChatConsole } from "@/components/modules/chat-console";
import { PageHeading } from "@/components/modules/page-heading";
import { ResourceManager } from "@/components/modules/resource-manager";

export default function CustomerChatPage() {
  return (
    <div className="space-y-4">
      <PageHeading title="Support Chat" description="Message your service team and monitor response updates." />
      <ChatConsole />
      <ResourceManager
        title="My Subscription"
        endpoint="subscriptions"
        compact
        fields={[
          { name: "planId", label: "Plan ID", required: true },
          { name: "status", label: "Status", required: true },
          { name: "notes", label: "Notes", type: "textarea" },
        ]}
      />
    </div>
  );
}
