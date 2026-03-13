"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Property = {
  id: string;
  label: string | null;
  addressLine1: string;
  city: string;
  postcode: string;
};

type MarketplaceResponse = {
  products: Array<{
    id: string;
    name: string;
    category: { name: string };
    sellPrice: number;
    availabilityStatus: string;
  }>;
};

type SelectedProductMap = Record<string, { quantity: number; note: string }>;

export function CustomerJobBooking() {
  const queryClient = useQueryClient();
  const properties = useQuery({
    queryKey: ["customer-properties"],
    queryFn: async () => apiFetch<ApiListResponse<Property>>("/api/resources/properties"),
  });
  const marketplace = useQuery({
    queryKey: ["customer-marketplace-catalog"],
    queryFn: async () =>
      apiFetch<{ data: MarketplaceResponse }>("/api/ops/marketplace/catalog"),
  });

  const [form, setForm] = useState({
    propertyId: "",
    title: "",
    issueCategory: "Plumbing",
    description: "",
    urgency: "MEDIUM",
    supplyMethod: "CONTRACTOR_SUPPLY",
    requestNotes: "",
  });
  const [selected, setSelected] = useState<SelectedProductMap>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProducts = useMemo(
    () =>
      Object.entries(selected).map(([productId, meta]) => ({
        productId,
        quantity: meta.quantity,
        note: meta.note || undefined,
      })),
    [selected],
  );

  const mutation = useMutation({
    mutationFn: async () =>
      apiFetch("/api/customer/jobs", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          isEmergency: form.urgency === "EMERGENCY",
          selectedProducts: selectedProducts.length > 0 ? selectedProducts : undefined,
        }),
      }),
    onSuccess: () => {
      setMessage("Service request submitted.");
      setError(null);
      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        requestNotes: "",
      }));
      setSelected({});
      queryClient.invalidateQueries({ queryKey: ["customer-jobs"] });
      queryClient.invalidateQueries({ queryKey: ["incoming-jobs"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    mutation.mutate();
  }

  const products = marketplace.data?.data.products ?? [];
  const showMarketplace = form.supplyMethod === "MARKETPLACE";

  return (
    <Card className="border-white/15 bg-slate-950/80">
      <CardHeader className="border-b border-white/10">
        <CardTitle className="text-white">Request a New Job</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <select
            className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
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
            className="bg-slate-900 text-white"
            required
          />
          <Input
            value={form.issueCategory}
            onChange={(event) => setForm((prev) => ({ ...prev, issueCategory: event.target.value }))}
            placeholder="Service type"
            className="bg-slate-900 text-white"
            required
          />
          <select
            className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
            value={form.urgency}
            onChange={(event) => setForm((prev) => ({ ...prev, urgency: event.target.value }))}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="EMERGENCY">Emergency</option>
          </select>
          <select
            className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
            value={form.supplyMethod}
            onChange={(event) => setForm((prev) => ({ ...prev, supplyMethod: event.target.value }))}
          >
            <option value="CONTRACTOR_SUPPLY">Contractor supplies product</option>
            <option value="CUSTOMER_SUPPLY">I will supply product</option>
            <option value="MARKETPLACE">Choose from marketplace</option>
          </select>
          <Textarea
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Describe the issue"
            className="bg-slate-900 text-white"
            required
          />
          <Textarea
            value={form.requestNotes}
            onChange={(event) => setForm((prev) => ({ ...prev, requestNotes: event.target.value }))}
            placeholder="Access notes, preferred slot, product preferences..."
            className="bg-slate-900 text-white"
          />

          {showMarketplace ? (
            <div className="rounded-xl border border-white/10 bg-slate-900/50 p-3">
              <p className="mb-2 text-sm text-white">Marketplace product selection (optional)</p>
              <div className="max-h-60 space-y-2 overflow-auto pr-1">
                {products.slice(0, 30).map((product) => {
                  const selectedEntry = selected[product.id];
                  const checked = Boolean(selectedEntry);
                  return (
                    <div key={product.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2 text-sm">
                      <label className="flex items-center gap-2 text-slate-200">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            if (!event.target.checked) {
                              setSelected((prev) => {
                                const next = { ...prev };
                                delete next[product.id];
                                return next;
                              });
                              return;
                            }
                            setSelected((prev) => ({
                              ...prev,
                              [product.id]: { quantity: 1, note: "" },
                            }));
                          }}
                        />
                        <span className="font-medium">{product.name}</span>
                      </label>
                      <p className="text-xs text-slate-400">
                        {product.category.name} | {formatMoney(product.sellPrice)} | {product.availabilityStatus}
                      </p>
                      {checked ? (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <Input
                            type="number"
                            min={1}
                            value={selectedEntry.quantity}
                            onChange={(event) =>
                              setSelected((prev) => ({
                                ...prev,
                                [product.id]: {
                                  ...prev[product.id],
                                  quantity: Number(event.target.value || 1),
                                },
                              }))
                            }
                            className="bg-slate-900 text-white"
                          />
                          <Input
                            value={selectedEntry.note}
                            onChange={(event) =>
                              setSelected((prev) => ({
                                ...prev,
                                [product.id]: {
                                  ...prev[product.id],
                                  note: event.target.value,
                                },
                              }))
                            }
                            placeholder="Notes"
                            className="bg-slate-900 text-white"
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Button type="submit" disabled={mutation.isPending}>
            Submit Request
          </Button>
        </form>
        {message ? (
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
            <p>{message}</p>
            <p className="mt-1 text-xs">Status: Request received | Under review | Allocation decision pending</p>
          </div>
        ) : null}
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
