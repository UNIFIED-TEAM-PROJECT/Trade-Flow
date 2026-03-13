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
    include: {
      jobRequest: {
        include: {
          selectedProducts: {
            include: {
              product: true,
            },
          },
        },
      },
      customer: true,
      property: true,
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

    if (status === JobStatus.COMPLETED && job.jobRequest?.selectedProducts?.length) {
      for (const selected of job.jobRequest.selectedProducts) {
        const existing = await tx.propertyAsset.findFirst({
          where: {
            organisationId: job.organisationId,
            installedJobId: job.id,
            productId: selected.productId,
          },
        });
        if (existing) {
          continue;
        }
        const warrantyStart = new Date();
        const warrantyExpiry = new Date(warrantyStart);
        warrantyExpiry.setFullYear(warrantyExpiry.getFullYear() + 2);

        const asset = await tx.propertyAsset.create({
          data: {
            organisationId: job.organisationId,
            propertyId: job.propertyId,
            customerId: job.customerId,
            productId: selected.productId,
            installedJobId: job.id,
            installedByTechnicianId: job.technicianId ?? null,
            assetType: selected.product.categoryId,
            name: selected.product.name,
            category: selected.product.categoryId,
            supplierName: "Marketplace selection",
            sourceCost: selected.product.sourceCost,
            sellPrice: selected.product.contractorSellPrice,
            installationDate: new Date(),
            room: "Not set",
            status: "ACTIVE",
            warrantyStart,
            warrantyExpiry,
            expectedReplacementMonths: 84,
            notes: "Created automatically from completed job workflow.",
          },
        });

        await tx.assetStatusHistory.create({
          data: {
            organisationId: job.organisationId,
            assetId: asset.id,
            fromStatus: null,
            toStatus: "ACTIVE",
            changedById: ctx.userId,
            note: "Asset created on job completion.",
          },
        });
      }
    }
    return next;
  });

  return NextResponse.json({ data: updated });
}
