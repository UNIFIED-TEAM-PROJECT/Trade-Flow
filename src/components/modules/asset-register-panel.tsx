"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type AssetOverview = {
  totals: {
    assets: number;
    active: number;
    faulty: number;
    replaced: number;
    expiringWithin90Days: number;
    replacementPipeline: number;
  };
  assets: Array<{
    id: string;
    name: string;
    assetType: string;
    category: string | null;
    status: string;
    room: string | null;
    floor: string | null;
    zone: string | null;
    installationDate: string | null;
    warrantyExpiry: string | null;
    notes: string | null;
    property: { id: string; addressLine1: string; city: string; postcode: string };
    customer: { id: string; displayName: string };
  }>;
  expiringWithin90Days: Array<{
    id: string;
    name: string;
    property: string;
    warrantyExpiry: string | null;
    customer: string;
  }>;
};

type PropertyOption = { id: string; customerId: string; addressLine1: string; city: string; postcode: string };
type ProductOption = { id: string; name: string; category: { name: string } | null };

export function AssetRegisterPanel({ managerMode = true }: { managerMode?: boolean }) {
  const queryClient = useQueryClient();
  const [roomFilter, setRoomFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    propertyId: "",
    customerId: "",
    productId: "",
    assetType: "",
    name: "",
    category: "",
    room: "",
    floor: "",
    zone: "",
    status: "ACTIVE",
    notes: "",
  });

  const overviewQuery = useQuery({
    queryKey: ["asset-overview"],
    queryFn: async () => apiFetch<{ data: AssetOverview }>("/api/ops/assets/overview"),
  });

  const propertiesQuery = useQuery({
    queryKey: ["asset-property-options"],
    queryFn: async () => apiFetch<ApiListResponse<PropertyOption>>("/api/resources/properties?take=200"),
    enabled: managerMode,
  });

  const productsQuery = useQuery({
    queryKey: ["asset-product-options"],
    queryFn: async () => apiFetch<ApiListResponse<ProductOption>>("/api/resources/products?take=300"),
  });

  const createAsset = useMutation({
    mutationFn: async () =>
      apiFetch("/api/resources/property-assets", {
        method: "POST",
        body: JSON.stringify({
          propertyId: form.propertyId,
          customerId: form.customerId,
          productId: form.productId || undefined,
          assetType: form.assetType,
          name: form.name,
          category: form.category || undefined,
          room: form.room || undefined,
          floor: form.floor || undefined,
          zone: form.zone || undefined,
          status: form.status,
          installationDate: new Date().toISOString(),
          notes: form.notes || undefined,
        }),
      }),
    onSuccess: async () => {
      setError(null);
      setForm({
        propertyId: "",
        customerId: "",
        productId: "",
        assetType: "",
        name: "",
        category: "",
        room: "",
        floor: "",
        zone: "",
        status: "ACTIVE",
        notes: "",
      });
      await queryClient.invalidateQueries({ queryKey: ["asset-overview"] });
      await queryClient.invalidateQueries({ queryKey: ["property-assets"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const requestFromAsset = useMutation({
    mutationFn: async (payload: { assetName: string; propertyId: string; category: string }) =>
      apiFetch("/api/customer/jobs", {
        method: "POST",
        body: JSON.stringify({
          propertyId: payload.propertyId,
          title: `Asset service request: ${payload.assetName}`,
          issueCategory: payload.category || "Property Asset",
          description: `Customer requested repair/replace action for ${payload.assetName}.`,
          urgency: "MEDIUM",
          isEmergency: false,
        }),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["asset-overview"] });
    },
  });

  const assets = useMemo(() => overviewQuery.data?.data.assets ?? [], [overviewQuery.data?.data.assets]);
  const filteredAssets = useMemo(
    () =>
      assets.filter((asset) => {
        if (roomFilter && (asset.room ?? "").toLowerCase() !== roomFilter.toLowerCase()) {
          return false;
        }
        if (statusFilter && asset.status !== statusFilter) {
          return false;
        }
        return true;
      }),
    [assets, roomFilter, statusFilter],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    createAsset.mutate();
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Assets</p>
            <p className="font-display text-2xl text-white">{overviewQuery.data?.data.totals.assets ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Active</p>
            <p className="font-display text-2xl text-emerald-300">{overviewQuery.data?.data.totals.active ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Faulty</p>
            <p className="font-display text-2xl text-red-300">{overviewQuery.data?.data.totals.faulty ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-white/15 bg-slate-950/80">
          <CardContent className="p-4">
            <p className="text-xs text-slate-400">Replaced</p>
            <p className="font-display text-2xl text-white">{overviewQuery.data?.data.totals.replaced ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-400/30 bg-amber-500/10">
          <CardContent className="p-4">
            <p className="text-xs text-amber-200">Warranty 90d</p>
            <p className="font-display text-2xl text-amber-100">
              {overviewQuery.data?.data.totals.expiringWithin90Days ?? 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border-tf-electric/30 bg-tf-electric/10">
          <CardContent className="p-4">
            <p className="text-xs text-blue-200">Replacement Pipeline</p>
            <p className="font-display text-2xl text-blue-100">
              {overviewQuery.data?.data.totals.replacementPipeline ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-white/15 bg-slate-950/80 xl:col-span-2">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Property Asset Register</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={roomFilter}
                onChange={(event) => setRoomFilter(event.target.value)}
                placeholder="Filter by room"
                className="bg-slate-900 text-white"
              />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="h-10 rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="FAULTY">Faulty</option>
                <option value="REPLACED">Replaced</option>
                <option value="REMOVED">Removed</option>
              </select>
            </div>
            <div className="space-y-2">
              {filteredAssets.slice(0, 60).map((asset) => (
                <div key={asset.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-white">{asset.name}</p>
                    <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs text-slate-300">
                      {asset.status}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    {asset.property.addressLine1}, {asset.property.city}
                  </p>
                  <p className="text-xs text-slate-400">
                    {asset.room ?? "Room not set"} | warranty{" "}
                    {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : "n/a"}
                  </p>
                  {!managerMode ? (
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        requestFromAsset.mutate({
                          assetName: asset.name,
                          propertyId: asset.property.id,
                          category: asset.category ?? asset.assetType,
                        })
                      }
                    >
                      Request Repair / Replace
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {managerMode ? (
          <Card className="border-white/15 bg-slate-950/80">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Create Asset</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={submit}>
                <select
                  value={form.propertyId}
                  onChange={(event) => {
                    const selected = (propertiesQuery.data?.data ?? []).find((item) => item.id === event.target.value);
                    setForm((prev) => ({
                      ...prev,
                      propertyId: event.target.value,
                      customerId: selected?.customerId ?? prev.customerId,
                    }));
                  }}
                  className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
                  required
                >
                  <option value="">Property</option>
                  {(propertiesQuery.data?.data ?? []).map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.addressLine1}, {property.city}
                    </option>
                  ))}
                </select>
                <select
                  value={form.productId}
                  onChange={(event) => {
                    const selected = (productsQuery.data?.data ?? []).find((product) => product.id === event.target.value);
                    setForm((prev) => ({
                      ...prev,
                      productId: event.target.value,
                      name: selected?.name ?? prev.name,
                      category: selected?.category?.name ?? prev.category,
                    }));
                  }}
                  className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
                >
                  <option value="">Linked product (optional)</option>
                  {(productsQuery.data?.data ?? []).map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <Input
                  value={form.assetType}
                  onChange={(event) => setForm((prev) => ({ ...prev, assetType: event.target.value }))}
                  placeholder="Asset type"
                  className="bg-slate-900 text-white"
                  required
                />
                <Input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Asset name"
                  className="bg-slate-900 text-white"
                  required
                />
                <Input
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="Category"
                  className="bg-slate-900 text-white"
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    value={form.floor}
                    onChange={(event) => setForm((prev) => ({ ...prev, floor: event.target.value }))}
                    placeholder="Floor"
                    className="bg-slate-900 text-white"
                  />
                  <Input
                    value={form.room}
                    onChange={(event) => setForm((prev) => ({ ...prev, room: event.target.value }))}
                    placeholder="Room"
                    className="bg-slate-900 text-white"
                  />
                  <Input
                    value={form.zone}
                    onChange={(event) => setForm((prev) => ({ ...prev, zone: event.target.value }))}
                    placeholder="Zone"
                    className="bg-slate-900 text-white"
                  />
                </div>
                <Textarea
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Notes"
                  className="min-h-[90px] bg-slate-900 text-white"
                />
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={createAsset.isPending}>
                  Create Asset
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-white/15 bg-slate-950/80">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Warranty Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(overviewQuery.data?.data.expiringWithin90Days ?? []).map((entry) => (
                <div key={entry.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                  <p className="font-medium text-white">{entry.name}</p>
                  <p className="text-slate-300">{entry.property}</p>
                  <p className="text-xs text-amber-200">
                    Warranty expiry:{" "}
                    {entry.warrantyExpiry ? new Date(entry.warrantyExpiry).toLocaleDateString() : "n/a"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
