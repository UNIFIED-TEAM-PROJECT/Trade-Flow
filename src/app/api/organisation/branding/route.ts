import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  companyName: z.string().min(2).optional(),
  logoPath: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  supportPhone: z.string().optional(),
  supportEmail: z.string().optional(),
  website: z.string().optional(),
  invoiceHeader: z.string().optional(),
  invoiceFooter: z.string().optional(),
  customerAppName: z.string().optional(),
});

export async function GET() {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const branding = await prisma.contractorBranding.findUnique({
    where: { organisationId: ctx.organisationId },
  });
  return NextResponse.json({ data: branding });
}

export async function PUT(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const input = schema.parse(await req.json());

  const existing = await prisma.contractorBranding.findUnique({
    where: { organisationId: ctx.organisationId },
  });
  if (existing) {
    const updated = await prisma.contractorBranding.update({
      where: { id: existing.id },
      data: input,
    });
    return NextResponse.json({ data: updated });
  }

  const created = await prisma.contractorBranding.create({
    data: {
      organisationId: ctx.organisationId!,
      companyName: input.companyName ?? "Contractor Company",
      ...input,
    },
  });
  return NextResponse.json({ data: created }, { status: 201 });
}
