import { IncomingRequestsBoard } from "@/components/modules/incoming-requests-board";
import { PageHeading } from "@/components/modules/page-heading";

export default function IncomingRequestsPage() {
  return (
    <div className="space-y-6">
      <PageHeading
        title="Incoming Requests"
        description="Operational intake queue for review, triage, subscriber SLA prioritisation, and dispatch routing."
      />
      <IncomingRequestsBoard />
    </div>
  );
}
