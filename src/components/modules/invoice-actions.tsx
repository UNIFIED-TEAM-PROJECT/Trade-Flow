"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client-api";

export function InvoiceActions() {
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      apiFetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: "POST",
        body: JSON.stringify({
          amount: amount ? Number(amount) : undefined,
          method,
        }),
      }),
    onSuccess: () => {
      setMessage("Invoice payment status updated.");
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
        <CardTitle>Mock Payment Flow</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-3 sm:grid-cols-4" onSubmit={submit}>
          <Input
            value={invoiceId}
            onChange={(event) => setInvoiceId(event.target.value)}
            placeholder="Invoice ID"
            required
          />
          <Input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount (optional)"
            type="number"
          />
          <select
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={method}
            onChange={(event) => setMethod(event.target.value)}
          >
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
            <option value="CASH">Cash</option>
          </select>
          <Button type="submit">Mark Paid</Button>
        </form>
        {message ? <p className="mt-2 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
