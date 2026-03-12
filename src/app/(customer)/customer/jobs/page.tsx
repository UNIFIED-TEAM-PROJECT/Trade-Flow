import { CustomerJobBooking } from "@/components/modules/customer-job-booking";
import { CustomerJobList } from "@/components/modules/customer-job-list";
import { EstimateActions } from "@/components/modules/estimate-actions";
import { PageHeading } from "@/components/modules/page-heading";

export default function CustomerJobsPage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Book & Track Jobs"
        description="Create new service requests, monitor technician progress, and approve estimates."
      />
      <CustomerJobBooking />
      <CustomerJobList />
      <EstimateActions />
    </div>
  );
}
