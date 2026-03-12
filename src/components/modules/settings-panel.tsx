"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiFetch, ApiListResponse } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type OrganisationResponse = {
  data: {
    id: string;
    name: string;
    timezone: string;
    onboardingComplete: boolean;
    branding?: {
      id: string;
      companyName: string;
      logoPath?: string | null;
      primaryColor: string;
      accentColor: string;
      supportPhone?: string | null;
      supportEmail?: string | null;
      website?: string | null;
      invoiceHeader?: string | null;
      invoiceFooter?: string | null;
      customerAppName?: string | null;
    } | null;
  };
};

export function SettingsPanel() {
  const organisation = useQuery({
    queryKey: ["organisation-profile"],
    queryFn: async () => apiFetch<OrganisationResponse>("/api/organisation/profile"),
  });
  const invites = useQuery({
    queryKey: ["invites"],
    queryFn: async () => apiFetch<ApiListResponse<Record<string, unknown>>>("/api/organisation/invites"),
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("TECHNICIAN");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const brandingMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      apiFetch("/api/organisation/branding", {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      setMessage("Branding saved.");
      setError(null);
    },
    onError: (err: Error) => setError(err.message),
  });

  const inviteMutation = useMutation({
    mutationFn: async () =>
      apiFetch<{ invitationLink: string }>("/api/organisation/invites", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      }),
    onSuccess: (data) => {
      setMessage(`Invite created: ${data.invitationLink}`);
      setError(null);
      setInviteEmail("");
      invites.refetch();
    },
    onError: (err: Error) => setError(err.message),
  });

  function saveBranding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    brandingMutation.mutate(payload);
  }

  function createInvite(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    inviteMutation.mutate();
  }

  const data = organisation.data?.data;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Company Branding</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={saveBranding}>
            <Input name="companyName" defaultValue={data?.branding?.companyName ?? data?.name} placeholder="Company Name" />
            <Input name="logoPath" defaultValue={data?.branding?.logoPath ?? ""} placeholder="Logo path" />
            <Input name="primaryColor" defaultValue={data?.branding?.primaryColor ?? "#0A1A33"} placeholder="Primary color" />
            <Input name="accentColor" defaultValue={data?.branding?.accentColor ?? "#0EA5E9"} placeholder="Accent color" />
            <Input name="supportPhone" defaultValue={data?.branding?.supportPhone ?? ""} placeholder="Support phone" />
            <Input name="supportEmail" defaultValue={data?.branding?.supportEmail ?? ""} placeholder="Support email" />
            <Input name="website" defaultValue={data?.branding?.website ?? ""} placeholder="Website" />
            <Input name="invoiceHeader" defaultValue={data?.branding?.invoiceHeader ?? ""} placeholder="Invoice header" />
            <Input name="invoiceFooter" defaultValue={data?.branding?.invoiceFooter ?? ""} placeholder="Invoice footer" />
            <Button type="submit">Save branding</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team Invites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 sm:grid-cols-3" onSubmit={createInvite}>
            <Input
              className="sm:col-span-2"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="invitee@company.com"
              type="email"
              required
            />
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
            >
              <option value="MANAGER">Manager</option>
              <option value="TECHNICIAN">Technician</option>
              <option value="CUSTOMER">Customer</option>
            </select>
            <Button className="sm:col-span-3" type="submit">
              Create invite
            </Button>
          </form>

          <div className="space-y-2">
            {(invites.data?.data ?? []).map((invite) => (
              <div key={String(invite.id)} className="rounded-lg border border-slate-200 p-2 text-sm">
                <p>{String(invite.email)}</p>
                <p className="text-slate-500">{String(invite.role)} - token {String(invite.token).slice(0, 8)}...</p>
              </div>
            ))}
          </div>
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
