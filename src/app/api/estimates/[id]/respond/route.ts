import { EstimateStatus, MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  decision: z.enum(["APPROVE", "DECLINE"]),
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getApiContext([
    MembershipRole.OWNER,
    MembershipRole.MANAGER,
    MembershipRole.CUSTOMER,
    MembershipRole.TECHNICIAN,
  ]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const input = schema.parse(await req.json());
  const estimate = await prisma.estimate.findFirst({
    where: {
      id: params.id,
      organisationId: ctx.organisationId,
      ...(ctx.role === MembershipRole.CUSTOMER ? { customer: { userId: ctx.userId } } : {}),
    },
  });

  if (!estimate) {
    return NextResponse.json({ error: "Estimate not found" }, { status: 404 });
  }

  const status = input.decision === "APPROVE" ? EstimateStatus.APPROVED : EstimateStatus.DECLINED;
  const data = await prisma.estimate.update({
    where: { id: estimate.id },
    data: {
      status,
      respondedAt: new Date(),
      notes: input.note ? `${estimate.notes ?? ""}\n${input.note}`.trim() : estimate.notes,
    },
  });

  if (status === EstimateStatus.APPROVED && estimate.jobId) {
    await prisma.job.update({
      where: { id: estimate.jobId },
      data: { status: "ESTIMATE_APPROVED" },
    });
  }

  return NextResponse.json({ data });
}
