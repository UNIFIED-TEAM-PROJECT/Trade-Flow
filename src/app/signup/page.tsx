"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client-api";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organisationName: "New Contractor Ltd",
    organisationSlug: "new-contractor",
    firstName: "Alex",
    lastName: "Owner",
    email: "newowner@demo.tradesflow",
    password: "password123",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });
      router.push("/app/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 p-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-panel">
        <img
          src="/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-dark.svg"
          alt="TradesFlow"
          className="h-10 w-auto"
        />
        <h1 className="mt-4 font-display text-2xl font-semibold">Create Contractor Workspace</h1>
        <p className="mt-1 text-sm text-slate-500">
          Launch your company tenant with owner access, branded defaults, and onboarding settings.
        </p>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Company Name</span>
            <Input
              value={form.organisationName}
              onChange={(event) => setForm((prev) => ({ ...prev, organisationName: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Company Slug</span>
            <Input
              value={form.organisationSlug}
              onChange={(event) => setForm((prev) => ({ ...prev, organisationSlug: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>First Name</span>
            <Input
              value={form.firstName}
              onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm">
            <span>Last Name</span>
            <Input
              value={form.lastName}
              onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Email</span>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span>Password</span>
            <Input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>
          {error ? <p className="sm:col-span-2 rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
          <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
            <Link href="/login" className="text-sm text-slate-500 hover:underline">
              Back to login
            </Link>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create workspace
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
