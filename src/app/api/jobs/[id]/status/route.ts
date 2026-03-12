import { JobStatus, MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  status: z.nativeEnum(JobStatus),
  note: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const { status, note } = schema.parse(await req.json());
  const job = await prisma.job.findFirst({
    where: {
      id: params.id,
      organisationId: ctx.organisationId,
      ...(ctx.role === MembershipRole.TECHNICIAN ? { technician: { userId: ctx.userId } } : {}),
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const next = await tx.job.update({
      where: { id: job.id },
      data: {
        status,
        startedAt:
          status === JobStatus.IN_PROGRESS && !job.startedAt
            ? new Date()
            : job.startedAt,
        completedAt:
          status === JobStatus.COMPLETED || status === JobStatus.PAID ? new Date() : job.completedAt,
      },
    });
    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        fromStatus: job.status,
        toStatus: status,
        changedById: ctx.userId,
        note,
      },
    });
    return next;
  });

  return NextResponse.json({ data: updated });
}
