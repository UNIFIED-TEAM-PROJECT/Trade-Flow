import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";
import { calculateVanReadiness, getLikelyMaterialsForJob } from "@/lib/ops";

const schema = z.object({
  jobId: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected." }, { status: 400 });
  }

  const parsed = schema.safeParse({
    jobId: req.nextUrl.searchParams.get("jobId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  const job = await prisma.job.findFirst({
    where: { id: parsed.data.jobId, organisationId: ctx.organisationId },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const vans = await prisma.van.findMany({
    where: { organisationId: ctx.organisationId, status: "ACTIVE" },
    include: {
      inventoryItems: {
        select: {
          name: true,
          quantity: true,
        },
      },
      assignedTechnician: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });

  const likely = getLikelyMaterialsForJob(job);
  const readiness = calculateVanReadiness(vans, likely.materials);
  const recommended = readiness[0] ?? null;

  return NextResponse.json({
    data: {
      jobId: job.id,
      likelyMaterials: likely.materials,
      template: likely.templateLabel,
      recommendedVan: recommended,
      vans: readiness,
    },
  });
}
