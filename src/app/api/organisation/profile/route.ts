import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).optional(),
  timezone: z.string().min(2).optional(),
  onboardingComplete: z.boolean().optional(),
});

export async function GET() {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const organisation = await prisma.organisation.findUnique({
    where: { id: ctx.organisationId },
    include: { branding: true },
  });
  return NextResponse.json({ data: organisation });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const data = schema.parse(await req.json());
  const organisation = await prisma.organisation.update({
    where: { id: ctx.organisationId },
    data,
  });
  return NextResponse.json({ data: organisation });
}
