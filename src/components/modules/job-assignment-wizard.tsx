"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type WizardJob = {
  id: string;
  title: string;
  urgency: string;
  serviceType: string;
  customer: { displayName: string };
  property: { address: string };
  aiTriage: { likelyMaterials: string[]; estimatedDurationMinutes: number; template: string };
  suggestion: {
    technician: { id: string; displayName: string } | null;
    van: { vanId: string; vanName: string; readinessScore: number; missing: string[] } | null;
  };
};

type TechnicianOption = { id: string; displayName: string };
type VanOption = { id: string; name: string; registration: string };

const STEPS = [
  "Review Request",
  "Service Path",
  "Technician",
  "Van",
  "Stock Check",
  "Schedule",
  "Confirm",
];

export function JobAssignmentWizard({
  job,
  onClose,
}: {
  job: WizardJob;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [servicePath, setServicePath] = useState<"ESTIMATE_FIRST" | "SCHEDULE_DIRECT" | "EMERGENCY_DISPATCH">(
    job.urgency === "EMERGENCY" ? "EMERGENCY_DISPATCH" : "SCHEDULE_DIRECT",
  );
  const [technicianId, setTechnicianId] = useState(job.suggestion.technician?.id ?? "");
  const [vanId, setVanId] = useState(job.suggestion.van?.vanId ?? "");
  const [scheduledAt, setScheduledAt] = useState(() => {
    const base = new Date();
    base.setHours(base.getHours() + 4);
    return base.toISOString().slice(0, 16);
  });
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const techniciansQuery = useQuery({
    queryKey: ["wizard-technicians"],
    queryFn: async () => apiFetch<{ data: TechnicianOption[] }>("/api/resources/technicians?take=200"),
  });

  const vansQuery = useQuery({
    queryKey: ["wizard-vans"],
    queryFn: async () => apiFetch<{ data: VanOption[] }>("/api/resources/vans?take=200"),
  });

  const readinessQuery = useQuery({
    queryKey: ["van-readiness", job.id],
    queryFn: async () =>
      apiFetch<{
        data: {
          recommendedVan: { vanId: string; readinessScore: number } | null;
          vans: Array<{
            vanId: string;
            vanName: string;
            readinessScore: number;
            inStock: string[];
            missing: string[];
          }>;
          likelyMaterials: string[];
        };
      }>(`/api/ops/van-readiness?jobId=${job.id}`),
    enabled: Boolean(job.id),
  });

  const selectedReadiness = useMemo(() => {
    return readinessQuery.data?.data.vans.find((entry) => entry.vanId === vanId) ?? null;
  }, [readinessQuery.data?.data.vans, vanId]);

  const assignMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/ops/jobs/${job.id}/assign`, {
        method: "POST",
        body: JSON.stringify({
          servicePath,
          technicianId: technicianId || undefined,
          vanId: vanId || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          sendConfirmation: true,
          note: note || undefined,
        }),
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["incoming-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard-overview"] }),
      ]);
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  function goNext() {
    setStep((current) => Math.min(7, current + 1));
  }

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  return (
    <Card className="border-white/15 bg-slate-950/85">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white">Accept & Assign Wizard</CardTitle>
        <p className="text-sm text-slate-300">
          Step {step} of 7: {STEPS[step - 1]}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-3">
          {STEPS.map((label, index) => (
            <div
              key={label}
              className={`rounded-xl border px-3 py-2 text-xs ${
                index + 1 <= step
                  ? "border-tf-electric/60 bg-tf-electric/15 text-white"
                  : "border-white/10 bg-slate-900/60 text-slate-400"
              }`}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="space-y-2 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200">
            <p className="font-medium text-white">{job.title}</p>
            <p>{job.customer.displayName}</p>
            <p>{job.property.address}</p>
            <p>Template: {job.aiTriage.template}</p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { key: "ESTIMATE_FIRST", label: "Estimate First" },
              { key: "SCHEDULE_DIRECT", label: "Direct Schedule" },
              { key: "EMERGENCY_DISPATCH", label: "Emergency Dispatch" },
            ].map((option) => (
              <button
                key={option.key}
                className={`rounded-xl border p-3 text-left text-sm ${
                  servicePath === option.key
                    ? "border-tf-electric bg-tf-electric/20 text-white"
                    : "border-white/10 bg-slate-900/60 text-slate-300"
                }`}
                onClick={() => setServicePath(option.key as typeof servicePath)}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        {step === 3 ? (
          <select
            className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
            value={technicianId}
            onChange={(event) => setTechnicianId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {(techniciansQuery.data?.data ?? []).map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.displayName}
              </option>
            ))}
          </select>
        ) : null}

        {step === 4 ? (
          <select
            className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
            value={vanId}
            onChange={(event) => setVanId(event.target.value)}
          >
            <option value="">Select van</option>
            {(vansQuery.data?.data ?? []).map((van) => (
              <option key={van.id} value={van.id}>
                {van.name} ({van.registration})
              </option>
            ))}
          </select>
        ) : null}

        {step === 5 ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm">
            <p className="text-white">Likely materials</p>
            <div className="flex flex-wrap gap-2">
              {(readinessQuery.data?.data.likelyMaterials ?? job.aiTriage.likelyMaterials).map((material) => (
                <Badge key={material}>{material}</Badge>
              ))}
            </div>
            {selectedReadiness ? (
              <div className="space-y-2">
                <p className="text-slate-200">
                  Readiness score: <span className="font-semibold text-white">{selectedReadiness.readinessScore}%</span>
                </p>
                {selectedReadiness.missing.length > 0 ? (
                  <p className="text-amber-300">Missing: {selectedReadiness.missing.join(", ")}</p>
                ) : (
                  <p className="text-emerald-300">All likely parts available.</p>
                )}
              </div>
            ) : (
              <p className="text-slate-400">Select a van to view readiness.</p>
            )}
          </div>
        ) : null}

        {step === 6 ? (
          <Input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="bg-slate-900 text-white"
          />
        ) : null}

        {step === 7 ? (
          <div className="space-y-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-200">
            <p className="text-white">Confirmation Summary</p>
            <p>Path: {servicePath.replaceAll("_", " ")}</p>
            <p>Technician: {(techniciansQuery.data?.data ?? []).find((item) => item.id === technicianId)?.displayName ?? "Unassigned"}</p>
            <p>Van: {(vansQuery.data?.data ?? []).find((item) => item.id === vanId)?.name ?? "Unassigned"}</p>
            <p>Schedule: {scheduledAt ? new Date(scheduledAt).toLocaleString() : "Not set"}</p>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Dispatch note (optional)"
              className="bg-slate-900 text-white"
            />
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goBack} disabled={step === 1}>
              Back
            </Button>
            {step < 7 ? (
              <Button onClick={goNext}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
                {assignMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Confirm Assignment
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
