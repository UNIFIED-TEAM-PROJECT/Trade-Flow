"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client-api";

export function EstimateActions() {
  const [estimateId, setEstimateId] = useState("");
  const [decision, setDecision] = useState<"APPROVE" | "DECLINE">("APPROVE");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/estimates/${estimateId}/respond`, {
        method: "POST",
        body: JSON.stringify({ decision }),
      }),
    onSuccess: () => {
      setMessage(`Estimate ${decision.toLowerCase()}d.`);
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    mutation.mutate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estimate Approval Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-3" onSubmit={submit}>
          <Input
            value={estimateId}
            onChange={(event) => setEstimateId(event.target.value)}
            placeholder="Estimate ID"
            required
          />
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={decision}
            onChange={(event) => setDecision(event.target.value as "APPROVE" | "DECLINE")}
          >
            <option value="APPROVE">Approve</option>
            <option value="DECLINE">Decline</option>
          </select>
          <Button type="submit">Submit Decision</Button>
        </form>
        {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
