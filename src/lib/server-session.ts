import { redirect } from "next/navigation";
import { getSessionFromCookieStore } from "./auth";
import { prisma } from "./db";

export async function requireSession() {
  const session = getSessionFromCookieStore();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: { organisation: true },
      },
    },
  });
  if (!user) {
    redirect("/login");
  }

  const membership =
    user.memberships.find((item) => item.organisationId === session.organisationId) ??
    user.memberships.find((item) => item.isPrimary) ??
    user.memberships[0] ??
    null;

  return { user, membership };
}
