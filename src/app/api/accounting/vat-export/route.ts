import { MembershipRole, VatPeriodStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  quarterLabel: z.string().min(3),
});

export async function POST(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected" }, { status: 400 });
  }

  const { quarterLabel } = schema.parse(await req.json());
  const period = await prisma.vatPeriod.findFirst({
    where: { organisationId: ctx.organisationId, quarterLabel },
  });

  if (!period) {
    return NextResponse.json({ error: "VAT period not found" }, { status: 404 });
  }

  const exported = await prisma.vatPeriod.update({
    where: { id: period.id },
    data: {
      status: VatPeriodStatus.EXPORTED,
      exportedAt: new Date(),
      hmrcPayload: {
        generatedAt: new Date().toISOString(),
        note: "HMRC submission stub payload for future API integration.",
        period: quarterLabel,
      },
    },
  });

  return NextResponse.json({
    data: exported,
    hmrcStub: {
      endpoint: "POST /future/hmrc/vat/submit",
      payloadReference: exported.id,
    },
  });
}
