"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client-api";

const STATUSES = [
  "LEAD",
  "ESTIMATE_DRAFTED",
  "ESTIMATE_SENT",
  "ESTIMATE_APPROVED",
  "SCHEDULED",
  "TECHNICIAN_ASSIGNED",
  "IN_PROGRESS",
  "AWAITING_MATERIALS",
  "COMPLETED",
  "INVOICE_SENT",
  "PAYMENT_PENDING",
  "PAID",
  "WARRANTY_FOLLOW_UP",
  "CANCELLED",
];

export function JobOperationsPanel() {
  const [jobId, setJobId] = useState("");
  const [status, setStatus] = useState("IN_PROGRESS");
  const [itemCode, setItemCode] = useState("");
  const [qty, setQty] = useState("1");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/jobs/${jobId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      setMessage("Job status updated.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const stockMutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/inventory/use`, {
        method: "POST",
        body: JSON.stringify({
          jobId,
          itemCode,
          quantity: Number(qty),
        }),
      }),
    onSuccess: () => {
      setMessage("Inventory deducted and linked to job materials.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  function onStatusSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    statusMutation.mutate();
  }

  function onStockSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    stockMutation.mutate();
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Job Workflow Action</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onStatusSubmit}>
            <Input
              placeholder="Job ID"
              value={jobId}
              onChange={(event) => setJobId(event.target.value)}
              required
            />
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={statusMutation.isPending}>
              Update Status
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Scan-to-Deduct Material</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={onStockSubmit}>
            <Input
              placeholder="Job ID"
              value={jobId}
              onChange={(event) => setJobId(event.target.value)}
              required
            />
            <Input
              placeholder="Barcode / QR / SKU"
              value={itemCode}
              onChange={(event) => setItemCode(event.target.value)}
              required
            />
            <Input
              type="number"
              min={1}
              value={qty}
              onChange={(event) => setQty(event.target.value)}
              required
            />
            <Button type="submit" disabled={stockMutation.isPending}>
              Deduct Material
            </Button>
          </form>
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-emerald-700 lg:col-span-2">{message}</p> : null}
      {error ? <p className="text-sm text-red-600 lg:col-span-2">{error}</p> : null}
    </div>
  );
}
