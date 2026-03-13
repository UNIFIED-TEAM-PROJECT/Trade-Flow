"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CalendarClock, MessageSquare, ShieldAlert, Truck } from "lucide-react";
import { apiFetch } from "@/lib/client-api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DispatchData = {
  queues: {
    incoming: number;
    awaitingEstimateApproval: number;
    readyToSchedule: number;
    emergencyQueue: number;
    slaRisk: number;
  };
  todayBoard: Array<{
    id: string;
    title: string;
    status: string;
    urgency: string;
    scheduledAt: string | null;
    technician: string;
    van: string;
    address: string;
  }>;
  technicianAvailability: Array<{
    id: string;
    displayName: string;
    status: string;
    jobsToday: number;
    nextAvailable: string;
    emergencyCapable: boolean;
    certifications: string[];
    vanAssigned: string | null;
  }>;
  vanReadiness: Array<{
    requestId: string;
    title: string;
    serviceType: string;
    likelyMaterials: string[];
    best: { vanId: string; vanName: string; registration: string; readinessScore: number } | null;
  }>;
  slaQueue: Array<{
    requestId: string;
    title: string;
    customer: string;
    slaState: string;
    slaTargetAt: string | null;
    urgency: string;
  }>;
  activeChats: Array<{
    id: string;
    subject: string;
    updatedAt: string;
    lastMessage: string;
  }>;
};

const TABS = [
  { key: "incoming", label: "Incoming Requests" },
  { key: "estimates", label: "Awaiting Estimate Approval" },
  { key: "schedule", label: "Ready to Schedule" },
  { key: "emergency", label: "Emergency Queue" },
  { key: "sla", label: "SLA Risk Queue" },
  { key: "today", label: "Today's Dispatch Board" },
  { key: "tech", label: "Technician Availability" },
  { key: "van", label: "Van Readiness" },
  { key: "chat", label: "Customer Comms" },
] as const;

export function DispatchCentrePanel() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["key"]>("incoming");

  const overviewQuery = useQuery({
    queryKey: ["dispatch-overview"],
    queryFn: async () => apiFetch<{ data: DispatchData }>("/api/ops/dispatch/overview"),
    refetchInterval: 20_000,
  });

  const incomingQuery = useQuery({
    queryKey: ["dispatch-incoming-board"],
    queryFn: async () =>
      apiFetch<{
        data: Array<{
          id: string;
          title: string;
          urgency: string;
          status: string;
          customer: { displayName: string; isSubscriber: boolean };
          property: { address: string };
          selectedProducts: Array<{ id: string; name: string; quantity: number }>;
        }>;
      }>("/api/ops/incoming-jobs"),
    refetchInterval: 20_000,
  });

  const data = overviewQuery.data?.data;
  const incoming = useMemo(() => incomingQuery.data?.data ?? [], [incomingQuery.data?.data]);

  const panel = useMemo(() => {
    if (!data) {
      return <p className="text-sm text-slate-300">Loading dispatch data...</p>;
    }

    if (activeTab === "incoming") {
      return (
        <div className="space-y-3">
          {incoming.slice(0, 12).map((request) => (
            <div key={request.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-white">{request.title}</p>
                <Badge variant={request.urgency === "EMERGENCY" ? "danger" : "default"}>{request.urgency}</Badge>
              </div>
              <p className="text-slate-300">{request.customer.displayName}</p>
              <p className="text-slate-400">{request.property.address}</p>
              {request.selectedProducts.length > 0 ? (
                <p className="mt-1 text-xs text-tf-orange">
                  Planned products:{" "}
                  {request.selectedProducts.map((entry) => `${entry.name} x${entry.quantity}`).join(", ")}
                </p>
              ) : null}
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={() => (window.location.href = "/app/incoming")}>
            Open Full Incoming Queue
          </Button>
        </div>
      );
    }

    if (activeTab === "estimates") {
      return (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
          Awaiting estimate approvals:{" "}
          <span className="font-semibold text-white">{data.queues.awaitingEstimateApproval}</span>
        </div>
      );
    }

    if (activeTab === "schedule") {
      return (
        <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300">
          Ready-to-schedule queue: <span className="font-semibold text-white">{data.queues.readyToSchedule}</span>
        </div>
      );
    }

    if (activeTab === "emergency") {
      return (
        <div className="space-y-2">
          {incoming
            .filter((request) => request.urgency === "EMERGENCY")
            .slice(0, 10)
            .map((request) => (
              <div key={request.id} className="rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm">
                <p className="font-medium text-red-100">{request.title}</p>
                <p className="text-red-200">{request.customer.displayName}</p>
              </div>
            ))}
        </div>
      );
    }

    if (activeTab === "sla") {
      return (
        <div className="space-y-2">
          {data.slaQueue.map((entry) => (
            <div key={entry.requestId} className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-sm">
              <p className="font-medium text-white">{entry.customer}</p>
              <p className="text-slate-200">{entry.title}</p>
              <p className="text-xs text-amber-200">
                {entry.slaState} {entry.slaTargetAt ? `- target ${new Date(entry.slaTargetAt).toLocaleString()}` : ""}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "today") {
      return (
        <div className="space-y-2">
          {data.todayBoard.map((job) => (
            <div key={job.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
              <p className="font-medium text-white">{job.title}</p>
              <p className="text-slate-300">{job.address}</p>
              <p className="text-slate-400">
                {job.technician} | {job.van} | {job.status.replaceAll("_", " ")}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "tech") {
      return (
        <div className="grid gap-2 md:grid-cols-2">
          {data.technicianAvailability.map((tech) => (
            <div key={tech.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
              <p className="font-medium text-white">{tech.displayName}</p>
              <p className="text-slate-300">
                {tech.status} | jobs today {tech.jobsToday}
              </p>
              <p className="text-slate-400">Van: {tech.vanAssigned ?? "Unassigned"}</p>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === "van") {
      return (
        <div className="space-y-2">
          {data.vanReadiness.map((entry) => (
            <div key={entry.requestId} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
              <p className="font-medium text-white">{entry.title}</p>
              <p className="text-slate-300">{entry.serviceType}</p>
              <p className="text-slate-300">
                Best van: {entry.best?.vanName ?? "None"} ({entry.best?.readinessScore ?? 0}%)
              </p>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {data.activeChats.map((thread) => (
          <div key={thread.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
            <p className="font-medium text-white">{thread.subject}</p>
            <p className="text-slate-300 line-clamp-2">{thread.lastMessage}</p>
            <p className="text-xs text-slate-500">{new Date(thread.updatedAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    );
  }, [activeTab, data, incoming]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Incoming</p>
            <p className="font-display text-2xl text-white">{data?.queues.incoming ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Estimate Approval</p>
            <p className="font-display text-2xl text-white">{data?.queues.awaitingEstimateApproval ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Ready to Schedule</p>
            <p className="font-display text-2xl text-white">{data?.queues.readyToSchedule ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-red-400/40 bg-red-500/10">
          <CardContent className="p-4">
            <p className="text-xs text-red-200">Emergency</p>
            <p className="font-display text-2xl text-red-100">{data?.queues.emergencyQueue ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-400/40 bg-amber-500/10">
          <CardContent className="p-4">
            <p className="text-xs text-amber-200">SLA Risk</p>
            <p className="font-display text-2xl text-amber-100">{data?.queues.slaRisk ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/15 bg-slate-950/80">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">Dispatch Centre</CardTitle>
          <p className="text-sm text-slate-300">
            Orchestrate intake, assignment, SLA protection, fleet readiness, and customer communications.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  activeTab === tab.key
                    ? "border-tf-electric bg-tf-electric/20 text-white"
                    : "border-white/15 bg-slate-900/60 text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {panel}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4 text-sm text-slate-300">
            <p className="mb-2 flex items-center gap-2 text-white">
              <AlertTriangle className="h-4 w-4 text-red-300" /> Emergency Queue
            </p>
            Prioritise emergency dispatch and protected members first.
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4 text-sm text-slate-300">
            <p className="mb-2 flex items-center gap-2 text-white">
              <Truck className="h-4 w-4 text-blue-300" /> Van Readiness
            </p>
            Combine stock fit, proximity, and route load for assignment quality.
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4 text-sm text-slate-300">
            <p className="mb-2 flex items-center gap-2 text-white">
              <ShieldAlert className="h-4 w-4 text-amber-300" /> SLA Guard
            </p>
            Track subscriber protection windows and escalate before breach.
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4 text-sm text-slate-300">
            <p className="mb-2 flex items-center gap-2 text-white">
              <CalendarClock className="h-4 w-4 text-tf-electric" /> Schedule Action
            </p>
            Convert accepted intake into booked jobs with confirmation messaging.
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4 text-sm text-slate-300">
            <p className="mb-2 flex items-center gap-2 text-white">
              <MessageSquare className="h-4 w-4 text-tf-orange" /> Customer Comms
            </p>
            Keep dispatch context visible with active thread summaries and last replies.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
