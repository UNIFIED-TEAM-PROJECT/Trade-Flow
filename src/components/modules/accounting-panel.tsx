"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/client-api";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AccountingOverview = {
  income: number;
  costs: number;
  profit: number;
  outputVat: number;
  inputVat: number;
  vatDue: number;
  outstandingInvoices: number;
};

export function AccountingPanel() {
  const [quarterLabel, setQuarterLabel] = useState("Q1 2026");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const overview = useQuery({
    queryKey: ["accounting-overview"],
    queryFn: async () => apiFetch<{ data: AccountingOverview }>("/api/accounting/overview"),
  });

  const exportMutation = useMutation({
    mutationFn: async () =>
      apiFetch("/api/accounting/vat-export", {
        method: "POST",
        body: JSON.stringify({ quarterLabel }),
      }),
    onSuccess: () => {
      setMessage("VAT export stub generated.");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    exportMutation.mutate();
  }

  const data = overview.data?.data;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Digital Accountant Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Income: {formatMoney(data?.income ?? 0)}</p>
          <p>Costs: {formatMoney(data?.costs ?? 0)}</p>
          <p>Profit: {formatMoney(data?.profit ?? 0)}</p>
          <p>Output VAT: {formatMoney(data?.outputVat ?? 0)}</p>
          <p>Input VAT: {formatMoney(data?.inputVat ?? 0)}</p>
          <p>VAT Due: {formatMoney(data?.vatDue ?? 0)}</p>
          <p>Outstanding Invoices: {data?.outstandingInvoices ?? 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>VAT Export Stub</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={submit}>
            <Input value={quarterLabel} onChange={(event) => setQuarterLabel(event.target.value)} />
            <Button type="submit">Generate HMRC-ready export payload</Button>
          </form>
          {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
