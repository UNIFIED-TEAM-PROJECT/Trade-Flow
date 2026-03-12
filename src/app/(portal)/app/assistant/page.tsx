import { AiAssistantPanel } from "@/components/modules/ai-assistant-panel";
import { PageHeading } from "@/components/modules/page-heading";

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="AI Assistant Layer"
        description="Deterministic triage and summary workflows with a provider abstraction for future LLM integration."
      />
      <AiAssistantPanel />
    </div>
  );
}
