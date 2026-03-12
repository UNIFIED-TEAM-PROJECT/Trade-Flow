"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiListResponse, apiFetch } from "@/lib/client-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CustomerJob = {
  id: string;
  title: string;
  issueCategory: string;
  status: string;
  urgency: string;
  createdAt: string;
  property?: { addressLine1: string; postcode: string } | null;
  technician?: { displayName: string } | null;
};

export function CustomerJobList() {
  const query = useQuery({
    queryKey: ["customer-jobs"],
    queryFn: async () => apiFetch<ApiListResponse<CustomerJob>>("/api/customer/jobs"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Jobs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(query.data?.data ?? []).map((job) => (
          <div key={job.id} className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">{job.title}</h3>
              <Badge variant={job.status === "PAID" ? "success" : "default"}>{job.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">{job.issueCategory}</p>
            <p className="mt-1 text-xs text-slate-500">{job.property?.addressLine1 ?? "Address pending"}</p>
            <p className="mt-1 text-xs text-slate-500">Technician: {job.technician?.displayName ?? "Unassigned"}</p>
          </div>
        ))}
        {query.data?.data.length === 0 ? <p className="text-sm text-slate-500">No jobs yet.</p> : null}
      </CardContent>
    </Card>
  );
}
