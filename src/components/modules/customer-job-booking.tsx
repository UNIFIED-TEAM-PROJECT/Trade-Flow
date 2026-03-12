"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Property = {
  id: string;
  label: string | null;
  addressLine1: string;
  postcode: string;
};

export function CustomerJobBooking() {
  const queryClient = useQueryClient();
  const properties = useQuery({
    queryKey: ["customer-properties"],
    queryFn: async () => apiFetch<ApiListResponse<Property>>("/api/resources/properties"),
  });

  const [form, setForm] = useState({
    propertyId: "",
    title: "",
    issueCategory: "Plumbing",
    description: "",
    urgency: "MEDIUM",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () =>
      apiFetch("/api/customer/jobs", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      setMessage("Service request submitted.");
      setError(null);
      setForm((prev) => ({ ...prev, title: "", description: "" }));
      queryClient.invalidateQueries({ queryKey: ["customer-jobs"] });
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
        <CardTitle>Book a Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <select
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={form.propertyId}
            onChange={(event) => setForm((prev) => ({ ...prev, propertyId: event.target.value }))}
            required
          >
            <option value="">Select property</option>
            {(properties.data?.data ?? []).map((property) => (
              <option key={property.id} value={property.id}>
                {(property.label ?? property.addressLine1) + ` (${property.postcode})`}
              </option>
            ))}
          </select>
          <Input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Issue title"
            required
          />
          <Input
            value={form.issueCategory}
            onChange={(event) => setForm((prev) => ({ ...prev, issueCategory: event.target.value }))}
            placeholder="Service type"
            required
          />
          <select
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            value={form.urgency}
            onChange={(event) => setForm((prev) => ({ ...prev, urgency: event.target.value }))}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
          <Textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Describe the issue"
            required
          />
          <Button type="submit" disabled={mutation.isPending}>
            Submit Request
          </Button>
        </form>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
