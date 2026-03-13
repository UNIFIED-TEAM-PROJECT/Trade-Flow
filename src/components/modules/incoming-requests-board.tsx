"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock3, Loader2, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobAssignmentWizard } from "@/components/modules/job-assignment-wizard";

type IncomingJob = {
  id: string;
  requestId: string;
  jobId: string | null;
  title: string;
  serviceType: string;
  urgency: string;
  status: string;
  isEmergency: boolean;
  supplyMethod: string;
  customer: {
    displayName: string;
    isSubscriber: boolean;
  };
  property: { address: string };
  aiTriage: {
    template: string;
    likelyMaterials: string[];
    estimatedDurationMinutes: number;
  };
  selectedProducts: Array<{ id: string; name: string; quantity: number }>;
  sla: {
    label: string;
    secondsRemaining: number | null;
    severity: "normal" | "high" | "critical";
  };
  suggestion: {
    technician: { id: string; displayName: string; workloadCount: number } | null;
    van: {
      vanId: string;
      vanName: string;
      registration: string;
      readinessScore: number;
      missing: string[];
      inStock: string[];
    } | null;
    travelMinutes: number;
    materialReadinessPct: number;
  };
};

function formatSla(seconds: number | null) {
  if (seconds === null) {
    return "No SLA timer";
  }
  if (seconds <= 0) {
    return "Breach";
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function IncomingRequestsBoard() {
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<IncomingJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const queueQuery = useQuery({
    queryKey: ["incoming-jobs"],
    queryFn: async () => apiFetch<{ data: IncomingJob[] }>("/api/ops/incoming-jobs"),
    refetchInterval: 20_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: { jobId: string; action: string; note?: string; scheduledAt?: string }) =>
      apiFetch(`/api/ops/jobs/${payload.jobId}/review`, {
        method: "POST",
        body: JSON.stringify({
          action: payload.action,
          note: payload.note,
          scheduledAt: payload.scheduledAt,
        }),
      }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({ queryKey: ["incoming-jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["jobs"] });
      await queryClient.invalidateQueries({ queryKey: ["dispatch-overview"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const queue = useMemo(() => queueQuery.data?.data ?? [], [queueQuery.data?.data]);
  const subscriberPriority = useMemo(
    () =>
      queue
        .filter((job) => job.customer.isSubscriber)
        .sort(
          (a, b) =>
            (a.sla.secondsRemaining ?? Number.MAX_SAFE_INTEGER) -
            (b.sla.secondsRemaining ?? Number.MAX_SAFE_INTEGER),
        ),
    [queue],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="border-white/15 bg-slate-950/80 xl:col-span-3">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Incoming Requests Queue</CardTitle>
            <p className="text-sm text-slate-300">
              Review, triage, and route customer requests into estimate, schedule, or emergency dispatch workflows.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {queueQuery.isLoading ? (
              <div className="flex items-center gap-2 text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading incoming requests...
              </div>
            ) : queue.length === 0 ? (
              <p className="text-sm text-slate-300">No incoming requests awaiting review.</p>
            ) : (
              queue.map((job) => (
                <div key={job.requestId} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-lg text-white">{job.title}</p>
                      <p className="text-sm text-slate-300">
                        {job.customer.displayName} | {job.property.address}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {job.customer.isSubscriber ? (
                        <Badge variant="success">
                          <ShieldCheck className="mr-1 h-3 w-3" /> Protected
                        </Badge>
                      ) : null}
                      {job.isEmergency ? (
                        <Badge variant="danger">
                          <AlertTriangle className="mr-1 h-3 w-3" /> Emergency
                        </Badge>
                      ) : (
                        <Badge>{job.urgency}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-400">AI triage</p>
                      <p>{job.aiTriage.template}</p>
                      <p className="text-xs text-slate-400">ETA duration {job.aiTriage.estimatedDurationMinutes} min</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Suggested dispatch</p>
                      <p>{job.suggestion.technician?.displayName ?? "No technician suggested"}</p>
                      <p>{job.suggestion.van?.vanName ?? "No van suggested"}</p>
                      <p className="text-xs text-slate-400">{job.suggestion.travelMinutes} min travel estimate</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3 text-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-400">Stock readiness</p>
                      <p>{job.suggestion.materialReadinessPct}% material ready</p>
                      <p className="text-xs text-slate-400">
                        Missing: {job.suggestion.van?.missing.length ? job.suggestion.van.missing.join(", ") : "None"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    Supply: {job.supplyMethod.replaceAll("_", " ")}
                    {job.selectedProducts.length
                      ? ` | Selected products: ${job.selectedProducts
                          .map((entry) => `${entry.name} x${entry.quantity}`)
                          .join(", ")}`
                      : ""}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => setSelectedJob(job)}>
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => reviewMutation.mutate({ jobId: job.id, action: "REJECT" })}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        reviewMutation.mutate({
                          jobId: job.id,
                          action: "REQUEST_INFO",
                          note: "Manager requested more details from customer.",
                        })
                      }
                    >
                      Request More Info
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reviewMutation.mutate({ jobId: job.id, action: "CONVERT_TO_ESTIMATE" })}
                    >
                      Convert to Estimate
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => reviewMutation.mutate({ jobId: job.id, action: "DISPATCH_EMERGENCY" })}
                    >
                      Dispatch Emergency
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        reviewMutation.mutate({
                          jobId: job.id,
                          action: "SCHEDULE_LATER",
                          scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
                        })
                      }
                    >
                      Schedule Later
                    </Button>
                  </div>
                </div>
              ))
            )}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
          </CardContent>
        </Card>

        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">SLA Priority Queue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {subscriberPriority.length === 0 ? (
              <p className="text-sm text-slate-300">No subscriber requests currently in queue.</p>
            ) : (
              subscriberPriority.slice(0, 8).map((job) => (
                <div key={job.requestId} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
                  <p className="font-medium text-white">{job.customer.displayName}</p>
                  <p className="text-slate-300">{job.title}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-amber-300">
                    <Clock3 className="h-3 w-3" /> {job.sla.label}: {formatSla(job.sla.secondsRemaining)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {selectedJob ? <JobAssignmentWizard job={selectedJob} onClose={() => setSelectedJob(null)} /> : null}
    </div>
  );
}
