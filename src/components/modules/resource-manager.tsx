"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea" | "date" | "datetime-local";
  required?: boolean;
};

type ResourceManagerProps = {
  title: string;
  endpoint: string;
  fields: FieldConfig[];
  subtitle?: string;
  compact?: boolean;
};

export function ResourceManager({ title, endpoint, fields, subtitle, compact = false }: ResourceManagerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [formState, setFormState] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((field) => [field.name, ""])),
  );
  const [error, setError] = useState<string | null>(null);

  const queryKey = useMemo(() => [endpoint, search], [endpoint, search]);
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () =>
      apiFetch<ApiListResponse<Record<string, unknown>>>(
        `/api/resources/${endpoint}${search ? `?q=${encodeURIComponent(search)}` : ""}`,
      ),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {};
      fields.forEach((field) => {
        const value = formState[field.name];
        if (value !== "") {
          payload[field.name] = field.type === "number" ? Number(value) : value;
        }
      });
      return apiFetch(`/api/resources/${endpoint}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setError(null);
      setFormState(Object.fromEntries(fields.map((field) => [field.name, ""])));
      setOpenForm(false);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-white">{title}</CardTitle>
          {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={`Search ${title.toLowerCase()}`}
            className="h-9 w-full bg-slate-900 text-white sm:w-64"
          />
          <Button size="sm" onClick={() => setOpenForm((v) => !v)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {openForm ? (
          <div className="rounded-lg border border-white/10 bg-slate-900/60 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <label key={field.name} className="space-y-1 text-sm text-slate-200">
                  <span>{field.label}</span>
                  {field.type === "textarea" ? (
                    <Textarea
                      required={field.required}
                      value={formState[field.name]}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                      className="bg-slate-950 text-white"
                    />
                  ) : (
                    <Input
                      type={field.type ?? "text"}
                      required={field.required}
                      value={formState[field.name]}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, [field.name]: event.target.value }))
                      }
                      className="bg-slate-950 text-white"
                    />
                  )}
                </label>
              ))}
            </div>
            {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
            <div className="mt-3 flex justify-end">
              <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-300">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : (
          <div className="space-y-2">
            {(data?.data ?? []).slice(0, compact ? 6 : 40).map((item, idx) => (
              <div key={String(item.id ?? idx)} className="rounded-lg border border-white/10 bg-slate-900/55 p-3">
                <pre className="overflow-x-auto text-xs text-slate-200">
                  {JSON.stringify(item, null, compact ? 0 : 2)}
                </pre>
              </div>
            ))}
            {data?.data?.length === 0 ? <p className="text-sm text-slate-400">No records found.</p> : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
