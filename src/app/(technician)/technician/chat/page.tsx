import { ChatConsole } from "@/components/modules/chat-console";
import { PageHeading } from "@/components/modules/page-heading";

export default function TechnicianChatPage() {
  return (
    <div className="space-y-4">
      <PageHeading title="Chat" description="Communicate with dispatch and customers on assigned jobs." />
      <ChatConsole />
    </div>
  );
}
