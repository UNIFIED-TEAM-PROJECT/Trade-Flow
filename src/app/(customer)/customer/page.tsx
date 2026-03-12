import { PageHeading } from "@/components/modules/page-heading";
import { CustomerJobList } from "@/components/modules/customer-job-list";
import { CustomerJobBooking } from "@/components/modules/customer-job-booking";

export default function CustomerHomePage() {
  return (
    <div className="space-y-4">
      <PageHeading
        title="Your Dashboard"
        description="View current service requests, estimated visits, active protection plan, and recent activity."
      />
      <CustomerJobBooking />
      <CustomerJobList />
    </div>
  );
}
