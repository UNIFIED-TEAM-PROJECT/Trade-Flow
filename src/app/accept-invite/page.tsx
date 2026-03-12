"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/client-api";

export default function AcceptInvitePage() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token"));
  }, []);

  async function acceptInvite() {
    setError(null);
    setMessage(null);
    try {
      await apiFetch("/api/organisation/invites/accept", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setMessage("Invite accepted. You can now access this workspace.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6">
        <h1 className="font-display text-2xl font-semibold">Accept Team Invite</h1>
        <p className="mt-2 text-sm text-slate-500">Join your contractor workspace with role permissions.</p>
        <p className="mt-4 rounded-md bg-slate-100 p-3 font-mono text-sm">{token || "Missing token"}</p>
        <div className="mt-4">
          <Button disabled={!token} onClick={acceptInvite}>
            Accept invite
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>
    </main>
  );
}
