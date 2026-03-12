import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layout/portal-shell";
import { requireSession } from "@/lib/server-session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, membership } = await requireSession();

  if (!membership) {
    redirect("/login");
  }

  if (membership.role === "CUSTOMER") {
    redirect("/customer");
  }

  return (
    <PortalShell
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        role: membership.role,
        organisationName: membership.organisation.name,
      }}
    >
      {children}
    </PortalShell>
  );
}
