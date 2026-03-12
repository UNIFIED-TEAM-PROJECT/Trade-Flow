import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const ctx = await getApiContext();
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const [organisation, memberships] = await Promise.all([
    ctx.organisationId
      ? prisma.organisation.findUnique({
          where: { id: ctx.organisationId },
          include: { branding: true },
        })
      : Promise.resolve(null),
    prisma.membership.findMany({
      where: { userId: ctx.userId },
      include: { organisation: true },
    }),
  ]);

  return NextResponse.json({
    user: {
      id: ctx.userId,
      email: ctx.email,
      firstName: ctx.firstName,
      lastName: ctx.lastName,
      role: ctx.role ?? null,
      platformRole: ctx.platformRole,
    },
    organisation,
    memberships,
  });
}
