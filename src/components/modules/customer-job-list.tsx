"use client";

import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { ApiListResponse, apiFetch } from "@/lib/client-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

type CustomerJob = {
  id: string;
  title: string;
  issueCategory: string;
  status: string;
  urgency: string;
  createdAt: string;
  isSubscriber: boolean;
  property?: { addressLine1: string; postcode: string } | null;
  technician?: { displayName: string } | null;
  estimate?: { id: string; status: string; total: string; validUntil: string | null } | null;
  invoice?: { id: string; status: string; total: string; issuedAt: string; dueAt: string | null } | null;
  jobRequest?: {
    id: string;
    status: string;
    supplyMethod: string;
    selectedProducts: Array<{
      id: string;
      quantity: number;
      product: { id: string; name: string };
    }>;
  } | null;
  statusHistory: Array<{ id: string; toStatus: string; note: string | null; createdAt: string }>;
};

const CUSTOMER_STATUS_STEPS = [
  "INCOMING_REQUEST",
  "UNDER_REVIEW",
  "ESTIMATE_SENT",
  "ESTIMATE_APPROVED",
  "SCHEDULED",
  "TECHNICIAN_ASSIGNED",
  "IN_PROGRESS",
  "COMPLETED",
  "INVOICE_SENT",
  "PAID",
];

export function CustomerJobList() {
  const query = useQuery({
    queryKey: ["customer-jobs"],
    queryFn: async () => apiFetch<ApiListResponse<CustomerJob>>("/api/customer/jobs"),
  });

  return (
    <Card className="border-white/15 bg-slate-950/80">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white">Job Status Tracker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {(query.data?.data ?? []).map((job) => (
          <div key={job.id} className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-white">{job.title}</h3>
              <Badge variant={job.status === "PAID" ? "success" : "default"}>{job.status}</Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-300">{job.issueCategory}</span>
              {job.isSubscriber ? (
                <Badge variant="success">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Protected member
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-400">{job.property?.addressLine1 ?? "Address pending"}</p>
            <p className="mt-1 text-xs text-slate-400">Technician: {job.technician?.displayName ?? "Unassigned"}</p>

            <div className="mt-3 grid gap-1 sm:grid-cols-3">
              {CUSTOMER_STATUS_STEPS.map((step) => {
                const activeIndex = CUSTOMER_STATUS_STEPS.indexOf(job.status);
                const stepIndex = CUSTOMER_STATUS_STEPS.indexOf(step);
                const active = stepIndex <= Math.max(activeIndex, 0);
                return (
                  <div
                    key={step}
                    className={`rounded-md border px-2 py-1 text-[11px] ${
                      active
                        ? "border-tf-electric/50 bg-tf-electric/20 text-white"
                        : "border-white/10 bg-slate-950/70 text-slate-500"
                    }`}
                  >
                    {step.replaceAll("_", " ")}
                  </div>
                );
              })}
            </div>

            {job.estimate ? (
              <div className="mt-3 rounded-lg border border-white/10 bg-slate-950/70 p-2 text-xs text-slate-300">
                Estimate: {job.estimate.status} | {formatMoney(job.estimate.total)}
              </div>
            ) : null}

            {job.invoice ? (
              <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/70 p-2 text-xs text-slate-300">
                Invoice: {job.invoice.status} | {formatMoney(job.invoice.total)}
              </div>
            ) : null}

            {job.jobRequest?.selectedProducts?.length ? (
              <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/70 p-2 text-xs text-slate-300">
                Selected products:{" "}
                {job.jobRequest.selectedProducts.map((entry) => `${entry.product.name} x${entry.quantity}`).join(", ")}
              </div>
            ) : null}

            {job.statusHistory.length > 0 ? (
              <div className="mt-2 rounded-lg border border-white/10 bg-slate-950/70 p-2 text-xs text-slate-400">
                Latest update: {job.statusHistory[0].toStatus.replaceAll("_", " ")} |{" "}
                {new Date(job.statusHistory[0].createdAt).toLocaleString()}
              </div>
            ) : null}
          </div>
        ))}
        {query.data?.data.length === 0 ? <p className="text-sm text-slate-400">No jobs yet.</p> : null}
      </CardContent>
    </Card>
  );
}
