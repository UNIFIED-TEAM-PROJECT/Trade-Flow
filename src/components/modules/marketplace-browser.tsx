"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MarketplaceResponse = {
  categories: Array<{ id: string; name: string; slug: string }>;
  products: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    category: { id: string; name: string; slug: string };
    brand: string | null;
    model: string | null;
    finishColor: string | null;
    availabilityStatus: string;
    sourceCost: number;
    sellPrice: number;
    marginAmount: number;
    marginPct: number;
    vatRate: number;
    imagePath: string | null;
    supplier: {
      supplierName: string;
      supplierSku: string | null;
      supplierUrl: string | null;
      supplierCost: number;
    } | null;
  }>;
};

type ProductOption = { id: string; name: string; slug: string; contractorSellPrice: number; sourceCost: number };
type CategoryOption = { id: string; name: string; slug: string };

export function MarketplaceBrowser({ managerMode = true }: { managerMode?: boolean }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [form, setForm] = useState({
    categoryId: "",
    name: "",
    slug: "",
    description: "",
    sourceCost: "0",
    contractorSellPrice: "0",
  });
  const [error, setError] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["marketplace-catalog", search, category],
    queryFn: async () =>
      apiFetch<{ data: MarketplaceResponse }>(
        `/api/ops/marketplace/catalog?q=${encodeURIComponent(search)}${category ? `&category=${encodeURIComponent(category)}` : ""}`,
      ),
  });

  const categoryQuery = useQuery({
    queryKey: ["marketplace-category-options"],
    queryFn: async () => apiFetch<ApiListResponse<CategoryOption>>("/api/resources/product-categories?take=200"),
  });

  const createProduct = useMutation({
    mutationFn: async () =>
      apiFetch("/api/resources/products", {
        method: "POST",
        body: JSON.stringify({
          categoryId: form.categoryId,
          name: form.name,
          slug: form.slug,
          description: form.description || undefined,
          sourceCost: Number(form.sourceCost),
          contractorSellPrice: Number(form.contractorSellPrice),
          availabilityStatus: "IN_STOCK",
        }),
      }),
    onSuccess: async () => {
      setError(null);
      setForm({
        categoryId: "",
        name: "",
        slug: "",
        description: "",
        sourceCost: "0",
        contractorSellPrice: "0",
      });
      await queryClient.invalidateQueries({ queryKey: ["marketplace-catalog"] });
      await queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const products = useMemo(() => query.data?.data.products ?? [], [query.data?.data.products]);
  const categories = query.data?.data.categories ?? [];
  const options = categoryQuery.data?.data ?? [];

  function submit(event: FormEvent) {
    event.preventDefault();
    createProduct.mutate();
  }

  const topCategorySales = useMemo(() => {
    const map = new Map<string, number>();
    for (const product of products) {
      map.set(product.category.name, (map.get(product.category.name) ?? 0) + product.sellPrice);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [products]);

  return (
    <div className="space-y-4">
      <Card className="border-white/15 bg-slate-950/80">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white">
            {managerMode ? "Marketplace Product Catalogue" : "TradesFlow Product Marketplace"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              className="bg-slate-900 text-white"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-10 rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
            >
              <option value="">All categories</option>
              {categories.map((entry) => (
                <option key={entry.id} value={entry.slug}>
                  {entry.name}
                </option>
              ))}
            </select>
            <div className="rounded-md border border-white/10 bg-slate-900/70 px-3 py-2 text-xs text-slate-300">
              Showing {products.length} products under contractor branding
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {products.slice(0, 60).map((product) => (
              <div key={product.id} className="rounded-xl border border-white/10 bg-slate-900/60 p-3 text-sm">
                <p className="font-medium text-white">{product.name}</p>
                <p className="text-xs text-slate-400">
                  {product.category.name}
                  {product.brand ? ` | ${product.brand}` : ""}
                  {product.model ? ` ${product.model}` : ""}
                </p>
                {product.description ? <p className="mt-1 text-slate-300">{product.description}</p> : null}
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-slate-950/70 p-2 text-slate-300">
                    Cost {formatMoney(product.sourceCost)}
                  </div>
                  <div className="rounded-md bg-slate-950/70 p-2 text-slate-300">
                    Sell {formatMoney(product.sellPrice)}
                  </div>
                  <div className="rounded-md bg-slate-950/70 p-2 text-slate-300">
                    Margin {formatMoney(product.marginAmount)}
                  </div>
                  <div className="rounded-md bg-slate-950/70 p-2 text-slate-300">
                    {product.marginPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="border-white/15 bg-slate-950/80 xl:col-span-2">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="text-white">Category Revenue Potential</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {topCategorySales.map(([name, total]) => (
              <div key={name} className="flex items-center justify-between rounded-md bg-slate-900/60 p-2">
                <span className="text-slate-300">{name}</span>
                <span className="font-medium text-white">{formatMoney(total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {managerMode ? (
          <Card className="border-white/15 bg-slate-950/80">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="text-white">Add Product</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-2" onSubmit={submit}>
                <select
                  className="h-10 w-full rounded-md border border-white/15 bg-slate-900 px-3 text-sm text-white"
                  value={form.categoryId}
                  onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                  required
                >
                  <option value="">Category</option>
                  {options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <Input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Product name"
                  className="bg-slate-900 text-white"
                  required
                />
                <Input
                  value={form.slug}
                  onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                  placeholder="Slug"
                  className="bg-slate-900 text-white"
                  required
                />
                <Input
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Description"
                  className="bg-slate-900 text-white"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.sourceCost}
                  onChange={(event) => setForm((prev) => ({ ...prev, sourceCost: event.target.value }))}
                  placeholder="Source cost"
                  className="bg-slate-900 text-white"
                />
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.contractorSellPrice}
                  onChange={(event) => setForm((prev) => ({ ...prev, contractorSellPrice: event.target.value }))}
                  placeholder="Sell price"
                  className="bg-slate-900 text-white"
                />
                {error ? <p className="text-sm text-red-400">{error}</p> : null}
                <Button type="submit" className="w-full" disabled={createProduct.isPending}>
                  Add Product
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
