import { ChatConsole } from "@/components/modules/chat-console";
import { PageHeading } from "@/components/modules/page-heading";

export default function ChatPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Customer & Technician Chat"
        description="In-app communication for customer updates, job coordination, and system event messaging."
      />
      <ChatConsole />
    </div>
  );
}
