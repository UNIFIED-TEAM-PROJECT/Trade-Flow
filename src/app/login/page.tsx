"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client-api";

type LoginResponse = {
  user: {
    role: "OWNER" | "MANAGER" | "TECHNICIAN" | "CUSTOMER" | null;
  };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (response.user.role === "CUSTOMER") {
        router.push("/customer");
      } else if (response.user.role === "TECHNICIAN") {
        router.push("/technician");
      } else {
        router.push("/app/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden bg-hero p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-noise opacity-40" />
        <div className="relative z-10">
          <Image
            src="/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-light.svg"
            alt="TradesFlow"
            className="h-12 w-auto"
            width={240}
            height={48}
          />
        </div>
        <div className="relative z-10 space-y-5">
          <h1 className="font-display text-4xl font-semibold">
            Run jobs, vans, inventory, invoices and customer experience in one system.
          </h1>
          <p className="max-w-xl text-white/85">
            TradesFlow gives your office team, technicians, and customers a shared real-time workflow from first
            enquiry to paid invoice.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center bg-[#040812] p-6">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-slate-950/80 p-7 shadow-panel">
          <div className="mb-6 text-center lg:text-left">
            <Image
              src="/branding/tradesflow_svg_bundle/tradesflow-logo-horizontal-light.svg"
              alt="TradesFlow"
              className="mx-auto h-10 w-auto lg:mx-0"
              width={200}
              height={40}
            />
            <h2 className="mt-4 font-display text-2xl font-semibold text-slate-100">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-400">Sign in to your TradesFlow workspace.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-1 text-sm text-slate-300">
              <span>Email</span>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                autoComplete="email"
                className="bg-slate-900 text-white"
                required
              />
            </label>
            <label className="space-y-1 text-sm text-slate-300">
              <span>Password</span>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="bg-slate-900 text-white"
                required
              />
            </label>
            {error ? <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">{error}</p> : null}
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-2 text-sm text-slate-400">
            <Link href="/signup" className="text-tf-electric hover:underline">
              Create contractor account
            </Link>
            <Link href="/forgot-password" className="text-slate-500 hover:underline">
              Forgot password
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
