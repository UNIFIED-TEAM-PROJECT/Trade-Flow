"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/client-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("owner@demo.tradesflow");
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("password123");
  const [message, setMessage] = useState<string | null>(null);

  async function requestReset(event: FormEvent) {
    event.preventDefault();
    const response = await apiFetch<{ resetToken?: string }>("/api/auth/password-reset/request", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    setToken(response.resetToken ?? null);
    setMessage("Reset token generated for MVP testing.");
  }

  async function applyReset(event: FormEvent) {
    event.preventDefault();
    if (!token) {
      return;
    }
    await apiFetch("/api/auth/password-reset/confirm", {
      method: "POST",
      body: JSON.stringify({ token, password: newPassword }),
    });
    setMessage("Password updated. You can now sign in.");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-2xl font-semibold">Password reset</h1>
        <p className="mt-1 text-sm text-slate-500">MVP flow includes on-screen token for local test environments.</p>
        <form onSubmit={requestReset} className="mt-6 space-y-3">
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          <Button type="submit">Request reset token</Button>
        </form>

        {token ? (
          <form onSubmit={applyReset} className="mt-6 space-y-3 rounded-lg border border-slate-200 p-4">
            <p className="text-sm text-slate-700">Token: <span className="font-mono">{token}</span></p>
            <Input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" />
            <Button type="submit">Set new password</Button>
          </form>
        ) : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        <Link href="/login" className="mt-4 inline-block text-sm text-tf-electric hover:underline">
          Back to login
        </Link>
      </div>
    </main>
  );
}
