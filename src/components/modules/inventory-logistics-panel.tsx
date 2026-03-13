"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Loader2, Warehouse } from "lucide-react";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type InventoryOverviewResponse = {
  totals: {
    totalStockValue: number;
    totalItems: number;
    lowStockCount: number;
    missingItemsCount: number;
    depotItemCount: number;
  };
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    reorderLevel: number;
    vanName: string;
    slotLabel: string | null;
  }>;
  mostUsedParts: Array<{ name: string; quantity: number }>;
  recentUsage: Array<{
    id: string;
    createdAt: string;
    itemName: string;
    quantity: number;
    note: string | null;
    jobTitle: string | null;
  }>;
  vanOverview: Array<{
    vanId: string;
    vanName: string;
    registration: string;
    stockValue: number;
    lowStock: number;
    usageLast30Days: number;
  }>;
  movementByType: Record<string, number>;
};

type RackMapResponse = {
  van: { id: string; name: string; registration: string; identifier: string };
  racks: Array<{
    id: string;
    label: string;
    slots: Array<{
      id: string;
      label: string;
      category: string | null;
      items: Array<{
        id: string;
        name: string;
        sku: string;
        quantity: number;
        reorderLevel: number;
        lowStock: boolean;
      }>;
    }>;
  }>;
};

type MovementLogItem = {
  id: string;
  type: string;
  quantity: number;
  note: string | null;
  createdAt: string;
  inventoryItem: {
    id: string;
    name: string;
    sku: string;
    van: { id: string; name: string; registration: string } | null;
    slot: { id: string; label: string } | null;
  };
  performedBy: { id: string; firstName: string; lastName: string } | null;
  job: { id: string; title: string; status: string } | null;
};

type VanOption = { id: string; name: string; registration: string };
type InventoryItemOption = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  vanId: string | null;
  slotId: string | null;
};
type JobOption = { id: string; title: string; status: string };

const ACTIONS = [
  "RESTOCK_DEPOT_TO_VAN",
  "TRANSFER_VAN_TO_VAN",
  "RETURN_TO_DEPOT",
  "DEDUCT_ON_JOB",
  "URGENT_PURCHASE",
  "MARK_DAMAGED",
  "MARK_LOST",
  "AUDIT_ADJUSTMENT",
] as const;

export function InventoryLogisticsPanel({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
  const [selectedVanId, setSelectedVanId] = useState<string>("");
  const [action, setAction] = useState<(typeof ACTIONS)[number]>("TRANSFER_VAN_TO_VAN");
  const [form, setForm] = useState({
    inventoryItemId: "",
    quantity: "1",
    targetVanId: "",
    targetSlotId: "",
    targetQuantity: "",
    jobId: "",
    note: "",
    name: "",
    sku: "",
    costPrice: "0",
  });
  const [error, setError] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: ["inventory-overview", selectedVanId],
    queryFn: async () =>
      apiFetch<{ data: InventoryOverviewResponse }>(
        `/api/ops/inventory/overview${selectedVanId ? `?vanId=${selectedVanId}` : ""}`,
      ),
  });

  const vansQuery = useQuery({
    queryKey: ["inventory-van-options"],
    queryFn: async () => apiFetch<ApiListResponse<VanOption>>("/api/resources/vans?take=200"),
  });

  const rackMapQuery = useQuery({
    queryKey: ["inventory-rack-map", selectedVanId],
    queryFn: async () =>
      apiFetch<{ data: RackMapResponse }>(
        `/api/ops/inventory/rack-map${selectedVanId ? `?vanId=${selectedVanId}` : ""}`,
      ),
  });

  const itemsQuery = useQuery({
    queryKey: ["inventory-item-options"],
    queryFn: async () =>
      apiFetch<ApiListResponse<InventoryItemOption>>("/api/resources/inventory-items?take=500"),
  });

  const jobsQuery = useQuery({
    queryKey: ["inventory-jobs-options"],
    queryFn: async () => apiFetch<ApiListResponse<JobOption>>("/api/resources/jobs?take=120"),
  });

  const movementsQuery = useQuery({
    queryKey: ["inventory-movements-log"],
    queryFn: async () => apiFetch<{ data: MovementLogItem[] }>("/api/ops/inventory/movements?take=120"),
  });

  const mutateMovement = useMutation({
    mutationFn: async () =>
      apiFetch("/api/ops/inventory/movements", {
        method: "POST",
        body: JSON.stringify({
          action,
          inventoryItemId: form.inventoryItemId || undefined,
          quantity: Number(form.quantity),
          targetVanId: form.targetVanId || undefined,
          targetSlotId: form.targetSlotId || undefined,
          targetQuantity: form.targetQuantity ? Number(form.targetQuantity) : undefined,
          jobId: form.jobId || undefined,
          note: form.note || undefined,
          name: form.name || undefined,
          sku: form.sku || undefined,
          costPrice: Number(form.costPrice || 0),
        }),
      }),
    onSuccess: async () => {
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["inventory-overview"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-rack-map"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements-log"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-item-options"] }),
      ]);
    },
    onError: (err: Error) => setError(err.message),
  });

  const depotItems = useMemo(
    () => (itemsQuery.data?.data ?? []).filter((item) => !item.vanId),
    [itemsQuery.data?.data],
  );

  const vanItems = useMemo(
    () => (itemsQuery.data?.data ?? []).filter((item) => Boolean(item.vanId)),
    [itemsQuery.data?.data],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    mutateMovement.mutate();
  }

  const overview = overviewQuery.data?.data;
  const rackMap = rackMapQuery.data?.data;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Stock Value</p>
            <p className="font-display text-2xl text-white">{formatMoney(overview?.totals.totalStockValue ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Low Stock</p>
            <p className="font-display text-2xl text-amber-300">{overview?.totals.lowStockCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Missing</p>
            <p className="font-display text-2xl text-red-300">{overview?.totals.missingItemsCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Depot Items</p>
            <p className="font-display text-2xl text-white">{overview?.totals.depotItemCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Tracked SKUs</p>
            <p className="font-display text-2xl text-white">{overview?.totals.totalItems ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className={`grid gap-4 ${compact ? "" : "xl:grid-cols-3"}`}>
        <Card className="border-white/15 bg-slate-950/80 xl:col-span-2">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Rack Layout View</CardTitle>
            <div className="mt-2">
              <select
                className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
                value={selectedVanId}
                onChange={(event) => setSelectedVanId(event.target.value)}
              >
                <option value="">Auto select first van</option>
                {(vansQuery.data?.data ?? []).map((van) => (
                  <option key={van.id} value={van.id}>
                    {van.name} ({van.registration})
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {rackMap ? (
              <>
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-200">
                  <p className="font-medium text-white">
                    {rackMap.van.name} ({rackMap.van.registration})
                  </p>
                  <p className="text-slate-400">Identifier: {rackMap.van.identifier}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {rackMap.racks.map((rack) => (
                    <div key={rack.id} className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
                      <p className="font-medium text-white">{rack.label}</p>
                      <div className="mt-2 grid gap-2">
                        {rack.slots.map((slot) => (
                          <div key={slot.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-2">
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                              <span>{slot.label}</span>
                              <span>{slot.category ?? "General"}</span>
                            </div>
                            {slot.items.length === 0 ? (
                              <p className="text-xs text-slate-500">Empty</p>
                            ) : (
                              slot.items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-xs text-slate-200">
                                  <span>{item.name}</span>
                                  <Badge variant={item.lowStock ? "warning" : "default"}>
                                    {item.quantity}
                                  </Badge>
                                </div>
                              ))
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-300">No rack data available.</p>
            )}
          </CardContent>
        </Card>

        {!compact ? (
          <Card className="border-white/15 bg-slate-950/80">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Stock Movement Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={submit}>
                <select
                  className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
                  value={action}
                  onChange={(event) => setAction(event.target.value as (typeof ACTIONS)[number])}
                >
                  {ACTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>

                <select
                  className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
                  value={form.inventoryItemId}
                  onChange={(event) => setForm((prev) => ({ ...prev, inventoryItemId: event.target.value }))}
                >
                  <option value="">Select source item</option>
                  {(action === "RESTOCK_DEPOT_TO_VAN" ? depotItems : vanItems).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.sku}) qty {item.quantity}
                    </option>
                  ))}
                </select>

                <Input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                  placeholder="Quantity"
                  className="bg-slate-900 text-white"
                />

                {action === "AUDIT_ADJUSTMENT" ? (
                  <Input
                    type="number"
                    min={0}
                    value={form.targetQuantity}
                    onChange={(event) => setForm((prev) => ({ ...prev, targetQuantity: event.target.value }))}
                    placeholder="Target quantity after count"
                    className="bg-slate-900 text-white"
                  />
                ) : null}

                {action === "DEDUCT_ON_JOB" ? (
                  <select
                    className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
                    value={form.jobId}
                    onChange={(event) => setForm((prev) => ({ ...prev, jobId: event.target.value }))}
                  >
                    <option value="">Select linked job</option>
                    {(jobsQuery.data?.data ?? []).map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title} ({job.status})
                      </option>
                    ))}
                  </select>
                ) : null}

                {action === "TRANSFER_VAN_TO_VAN" || action === "RESTOCK_DEPOT_TO_VAN" ? (
                  <select
                    className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
                    value={form.targetVanId}
                    onChange={(event) => setForm((prev) => ({ ...prev, targetVanId: event.target.value }))}
                  >
                    <option value="">Select target van</option>
                    {(vansQuery.data?.data ?? []).map((van) => (
                      <option key={van.id} value={van.id}>
                        {van.name} ({van.registration})
                      </option>
                    ))}
                  </select>
                ) : null}

                {action === "URGENT_PURCHASE" ? (
                  <div className="grid gap-2">
                    <Input
                      value={form.name}
                      onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Purchased item name"
                      className="bg-slate-900 text-white"
                    />
                    <Input
                      value={form.sku}
                      onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                      placeholder="SKU (optional)"
                      className="bg-slate-900 text-white"
                    />
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.costPrice}
                      onChange={(event) => setForm((prev) => ({ ...prev, costPrice: event.target.value }))}
                      placeholder="Cost price"
                      className="bg-slate-900 text-white"
                    />
                  </div>
                ) : null}

                <Textarea
                  value={form.note}
                  onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                  placeholder="Movement note"
                  className="min-h-[80px] bg-slate-900 text-white"
                />

                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <Button type="submit" disabled={mutateMovement.isPending} className="w-full">
                  {mutateMovement.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                  Log Movement
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(overview?.lowStockItems ?? []).slice(0, 10).map((item) => (
              <div key={item.id} className="rounded-lg border border-white/10 bg-slate-900/55 p-3 text-sm">
                <p className="text-white">{item.name}</p>
                <p className="text-slate-300">
                  {item.vanName} {item.slotLabel ? `| ${item.slotLabel}` : ""}
                </p>
                <p className="text-amber-300">
                  {item.quantity} / reorder {item.reorderLevel}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Stock Movement Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(movementsQuery.data?.data ?? []).slice(0, 12).map((movement) => (
              <div key={movement.id} className="rounded-lg border border-white/10 bg-slate-900/55 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-white">{movement.inventoryItem.name}</p>
                  <Badge>{movement.type}</Badge>
                </div>
                <p className="text-slate-300">
                  qty {movement.quantity} | {new Date(movement.createdAt).toLocaleString()}
                </p>
                <p className="text-slate-400">
                  {movement.performedBy
                    ? `${movement.performedBy.firstName} ${movement.performedBy.lastName}`
                    : "System"}
                  {movement.job ? ` | ${movement.job.title}` : ""}
                </p>
                {movement.note ? <p className="text-slate-400">{movement.note}</p> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {!compact ? (
        <Card className="border-white/15 bg-slate-950/80">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2 text-white">
              <Warehouse className="h-4 w-4" /> Depot & Van Utilisation Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {(overview?.vanOverview ?? []).map((van) => (
              <div key={van.vanId} className="rounded-xl border border-white/10 bg-slate-900/55 p-3 text-sm">
                <p className="font-medium text-white">{van.vanName}</p>
                <p className="text-slate-300">{van.registration}</p>
                <p className="text-slate-300">Value: {formatMoney(van.stockValue)}</p>
                <p className="text-slate-300">Low stock lines: {van.lowStock}</p>
                <p className="text-slate-300">Usage (30d): {van.usageLast30Days}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
