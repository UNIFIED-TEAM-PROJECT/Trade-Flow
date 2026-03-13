"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, Navigation, PackageOpen, PlayCircle, Timer } from "lucide-react";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AssignedJob = {
  id: string;
  title: string;
  issueCategory: string;
  description: string;
  status: string;
  urgency: string;
  labourMinutes: number;
  notes: string | null;
  customer: { displayName: string; email: string } | null;
  property: { addressLine1: string; city: string; postcode: string } | null;
  van: { id: string; name: string; registration: string } | null;
};

type InventoryItem = { id: string; name: string; sku: string; quantity: number; vanId: string | null };

export function TechnicianJobExecution() {
  const queryClient = useQueryClient();
  const [activeJobId, setActiveJobId] = useState<string>("");
  const [materialItemId, setMaterialItemId] = useState("");
  const [materialQty, setMaterialQty] = useState("1");
  const [labourMinutes, setLabourMinutes] = useState("120");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const jobsQuery = useQuery({
    queryKey: ["tech-assigned-jobs"],
    queryFn: async () => apiFetch<ApiListResponse<AssignedJob>>("/api/resources/jobs?take=80"),
  });

  const itemsQuery = useQuery({
    queryKey: ["tech-inventory-items"],
    queryFn: async () => apiFetch<ApiListResponse<InventoryItem>>("/api/resources/inventory-items?take=300"),
  });

  const activeJob = useMemo(
    () => (jobsQuery.data?.data ?? []).find((job) => job.id === activeJobId) ?? null,
    [jobsQuery.data?.data, activeJobId],
  );

  const filteredItems = useMemo(() => {
    if (!activeJob?.van?.id) {
      return itemsQuery.data?.data ?? [];
    }
    return (itemsQuery.data?.data ?? []).filter((item) => item.vanId === activeJob.van?.id || !item.vanId);
  }, [itemsQuery.data?.data, activeJob?.van?.id]);

  const statusMutation = useMutation({
    mutationFn: async (payload: { jobId: string; status: string; note?: string }) =>
      apiFetch(`/api/jobs/${payload.jobId}/status`, {
        method: "POST",
        body: JSON.stringify({
          status: payload.status,
          note: payload.note,
        }),
      }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tech-assigned-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const materialMutation = useMutation({
    mutationFn: async () =>
      apiFetch("/api/ops/inventory/movements", {
        method: "POST",
        body: JSON.stringify({
          action: "DEDUCT_ON_JOB",
          inventoryItemId: materialItemId,
          quantity: Number(materialQty),
          jobId: activeJobId,
          note: "Technician consumed material on-site",
        }),
      }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tech-inventory-items"] }),
        queryClient.invalidateQueries({ queryKey: ["tech-assigned-jobs"] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiFetch(`/api/resources/jobs/${activeJobId}`, {
        method: "PATCH",
        body: JSON.stringify({
          labourMinutes: Number(labourMinutes),
          notes: note || undefined,
        }),
      });
      return apiFetch(`/api/jobs/${activeJobId}/status`, {
        method: "POST",
        body: JSON.stringify({
          status: "COMPLETED",
          note: "Technician completed job from mobile execution flow.",
        }),
      });
    },
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tech-assigned-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["invoices"] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  return (
    <div className="space-y-4">
      <Card className="border-white/15 bg-slate-950/80">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">Assigned Job Detail</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
            value={activeJobId}
            onChange={(event) => setActiveJobId(event.target.value)}
          >
            <option value="">Select assigned job</option>
            {(jobsQuery.data?.data ?? []).map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} ({job.status})
              </option>
            ))}
          </select>

          {activeJob ? (
            <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/55 p-3 text-sm text-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{activeJob.title}</p>
                  <p>{activeJob.customer?.displayName ?? "Customer TBD"}</p>
                  <p>{activeJob.property ? `${activeJob.property.addressLine1}, ${activeJob.property.city}` : "Property TBD"}</p>
                </div>
                <Badge variant={activeJob.urgency === "EMERGENCY" ? "danger" : "default"}>{activeJob.urgency}</Badge>
              </div>
              <p className="text-slate-300">{activeJob.description}</p>
              <p className="text-slate-300">Assigned van: {activeJob.van?.name ?? "Unassigned"}</p>

              <div className="grid gap-2 sm:grid-cols-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    statusMutation.mutate({
                      jobId: activeJob.id,
                      status: "TECHNICIAN_ASSIGNED",
                      note: "Travel started from technician flow.",
                    })
                  }
                >
                  <Navigation className="mr-2 h-4 w-4" /> Travel Start
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    statusMutation.mutate({
                      jobId: activeJob.id,
                      status: "IN_PROGRESS",
                      note: "Arrived on site and job started.",
                    })
                  }
                >
                  <PlayCircle className="mr-2 h-4 w-4" /> Start Job
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    statusMutation.mutate({
                      jobId: activeJob.id,
                      status: "AWAITING_MATERIALS",
                      note: "Waiting for additional materials.",
                    })
                  }
                >
                  <Timer className="mr-2 h-4 w-4" /> Await Materials
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Use Inventory on Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
              value={materialItemId}
              onChange={(event) => setMaterialItemId(event.target.value)}
            >
              <option value="">Select part</option>
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.sku}) qty {item.quantity}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min={1}
              value={materialQty}
              onChange={(event) => setMaterialQty(event.target.value)}
              className="bg-slate-900 text-white"
            />
            <Button
              onClick={() => materialMutation.mutate()}
              disabled={materialMutation.isPending || !activeJobId || !materialItemId}
            >
              {materialMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PackageOpen className="mr-2 h-4 w-4" />}
              Deduct Material
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Before / After + Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-300">
              Photo upload slots are ready via file service. Add notes and labour before completion.
            </p>
            <Input
              type="number"
              min={0}
              value={labourMinutes}
              onChange={(event) => setLabourMinutes(event.target.value)}
              className="bg-slate-900 text-white"
              placeholder="Labour minutes"
            />
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="bg-slate-900 text-white"
              placeholder="Completion notes, photos captured, follow-up details..."
            />
            <Button onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending || !activeJobId}>
              {completeMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Mark Complete
            </Button>
          </CardContent>
        </Card>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {activeJob ? (
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Technician Execution Timeline</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-4">
            {[
              { icon: Navigation, label: "Travel Start" },
              { icon: Clock, label: "Arrive & Start" },
              { icon: PackageOpen, label: "Use Materials" },
              { icon: CheckCircle2, label: "Complete + Invoice" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-xl border border-white/10 bg-slate-900/55 p-3 text-sm">
                  <Icon className="mb-2 h-4 w-4 text-tf-electric" />
                  <p className="text-white">{item.label}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
