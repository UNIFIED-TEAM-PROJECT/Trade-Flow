import {
  EstimateStatus,
  JobRequestStatus,
  JobStatus,
  JobUrgency,
  LineItemType,
  MembershipRole,
  SlaState,
} from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";
import { calculateVanReadiness, getLikelyMaterialsForJob } from "@/lib/ops";

const schema = z.object({
  servicePath: z.enum(["ESTIMATE_FIRST", "SCHEDULE_DIRECT", "EMERGENCY_DISPATCH"]),
  technicianId: z.string().optional(),
  vanId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  sendConfirmation: z.boolean().default(true),
  note: z.string().optional(),
});

function deriveNextStatus(
  servicePath: z.infer<typeof schema>["servicePath"],
  hasTechnician: boolean,
  hasVan: boolean,
) {
  if (servicePath === "ESTIMATE_FIRST") {
    return JobStatus.ESTIMATE_DRAFTED;
  }
  if (servicePath === "EMERGENCY_DISPATCH") {
    return JobStatus.TECHNICIAN_ASSIGNED;
  }
  if (hasTechnician && hasVan) {
    return JobStatus.VAN_ASSIGNED;
  }
  if (hasTechnician) {
    return JobStatus.TECHNICIAN_ASSIGNED;
  }
  return JobStatus.SCHEDULED;
}

function deriveRequestStatus(servicePath: z.infer<typeof schema>["servicePath"]) {
  if (servicePath === "ESTIMATE_FIRST") {
    return JobRequestStatus.ESTIMATE_REQUIRED;
  }
  if (servicePath === "EMERGENCY_DISPATCH") {
    return JobRequestStatus.EMERGENCY_DISPATCHED;
  }
  return JobRequestStatus.SCHEDULED;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const organisationId = ctx.organisationId;
  if (!organisationId) {
    return NextResponse.json({ error: "No organisation selected." }, { status: 400 });
  }

  const input = schema.parse(await req.json());
  const job = await prisma.job.findFirst({
    where: { id: params.id, organisationId },
    include: {
      customer: true,
      estimate: true,
      property: true,
      jobRequest: {
        include: {
          selectedProducts: {
            include: {
              product: true,
            },
          },
        },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const [technician, vans] = await Promise.all([
    input.technicianId
      ? prisma.technician.findFirst({
          where: { id: input.technicianId, organisationId },
        })
      : Promise.resolve(null),
    prisma.van.findMany({
      where: { organisationId, status: "ACTIVE" },
      include: { inventoryItems: { select: { name: true, quantity: true } } },
    }),
  ]);

  if (input.technicianId && !technician) {
    return NextResponse.json({ error: "Technician not found." }, { status: 404 });
  }

  const selectedVan = input.vanId ? vans.find((van) => van.id === input.vanId) ?? null : null;
  if (input.vanId && !selectedVan) {
    return NextResponse.json({ error: "Van not found." }, { status: 404 });
  }

  const likely = getLikelyMaterialsForJob(job);
  const readiness = calculateVanReadiness(vans, likely.materials);
  const selectedVanReadiness = selectedVan ? readiness.find((item) => item.vanId === selectedVan.id) ?? null : null;
  const recommendedVan = readiness[0] ?? null;
  const selectedProducts = job.jobRequest?.selectedProducts ?? [];

  const nextStatus = deriveNextStatus(input.servicePath, Boolean(technician), Boolean(selectedVan));
  const requestStatus = deriveRequestStatus(input.servicePath);

  const result = await prisma.$transaction(async (tx) => {
    const updatedJob = await tx.job.update({
      where: { id: job.id },
      data: {
        status: nextStatus,
        technicianId: technician?.id ?? job.technicianId,
        vanId: selectedVan?.id ?? job.vanId,
        scheduledAt: input.scheduledAt
          ? new Date(input.scheduledAt)
          : input.servicePath === "EMERGENCY_DISPATCH"
            ? new Date()
            : job.scheduledAt,
        urgency: input.servicePath === "EMERGENCY_DISPATCH" ? JobUrgency.EMERGENCY : job.urgency,
        isEmergency: input.servicePath === "EMERGENCY_DISPATCH" ? true : job.isEmergency,
        estimatedDurationMinutes: likely.estimatedDurationMinutes,
        slaState:
          input.servicePath === "EMERGENCY_DISPATCH"
            ? SlaState.CRITICAL
            : job.customer.isSubscriber
              ? SlaState.AT_RISK
              : job.slaState,
      },
    });

    const request =
      job.jobRequest ??
      (await tx.jobRequest.create({
        data: {
          organisationId: job.organisationId,
          customerId: job.customerId,
          propertyId: job.propertyId,
          linkedJobId: job.id,
          title: job.title,
          serviceType: job.issueCategory,
          description: job.description,
          urgency: job.urgency,
          status: JobRequestStatus.ACCEPTED,
          supplyMethod: job.supplyMethod,
          isEmergency: job.isEmergency,
          subscriberPriority: job.customer.isSubscriber,
          aiSummary: job.aiSummary,
          suggestedUrgency: job.urgency,
          suggestedServiceType: job.issueCategory,
          suggestedMaterials: likely.materials,
          slaTargetAt: job.slaTargetAt,
          slaState: job.slaState,
          requestedAt: job.createdAt,
        },
      }));

    await tx.jobRequest.update({
      where: { id: request.id },
      data: {
        status: requestStatus,
        reviewedAt: new Date(),
        reviewedById: ctx.userId,
        reviewNotes: input.note ?? undefined,
      },
    });

    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        fromStatus: job.status,
        toStatus: nextStatus,
        changedById: ctx.userId,
        note:
          input.note ??
          `Assignment workflow completed via ${input.servicePath.replaceAll("_", " ").toLowerCase()}.`,
      },
    });

    if (input.servicePath === "ESTIMATE_FIRST" && !job.estimate) {
      const estimateCount = await tx.estimate.count({
        where: { organisationId },
      });
      const estimateNumber = `EST-${new Date().getFullYear()}-${String(estimateCount + 1).padStart(4, "0")}`;
      const labourLineTotal = 95;
      const materialLineTotal = likely.materials.length * 14;
      const selectedProductTotal = selectedProducts.reduce(
        (sum, entry) => sum + Number(entry.product.contractorSellPrice) * entry.quantity,
        0,
      );
      const subtotal = labourLineTotal + materialLineTotal + selectedProductTotal;
      const vat = subtotal * 0.2;

      const estimate = await tx.estimate.create({
        data: {
          organisationId,
          jobId: job.id,
          customerId: job.customerId,
          propertyId: job.propertyId,
          number: estimateNumber,
          status: EstimateStatus.DRAFT,
          subtotal: subtotal.toFixed(2),
          vatTotal: vat.toFixed(2),
          total: (subtotal + vat).toFixed(2),
          notes: `Draft estimate generated from dispatch review (${likely.templateLabel}).`,
          createdById: ctx.userId,
        },
      });

      await tx.estimateLineItem.createMany({
        data: [
          {
            estimateId: estimate.id,
            type: LineItemType.LABOUR,
            description: "Initial labour allocation",
            quantity: "1.00",
            unitPrice: labourLineTotal.toFixed(2),
            vatRate: "20.00",
            total: labourLineTotal.toFixed(2),
          },
          ...likely.materials.slice(0, 4).map((material) => ({
            estimateId: estimate.id,
            type: LineItemType.MATERIAL,
            description: material,
            quantity: "1.00",
            unitPrice: "14.00",
            vatRate: "20.00",
            total: "14.00",
          })),
          ...selectedProducts.map((entry) => ({
            estimateId: estimate.id,
            productId: entry.productId,
            type: LineItemType.MATERIAL,
            description: `${entry.product.name} (customer selected)`,
            quantity: entry.quantity.toFixed(2),
            unitPrice: Number(entry.product.contractorSellPrice).toFixed(2),
            vatRate: "20.00",
            total: (Number(entry.product.contractorSellPrice) * entry.quantity).toFixed(2),
          })),
        ],
      });
    }

    if (input.sendConfirmation && job.customer.userId) {
      await tx.notification.create({
        data: {
          organisationId,
          userId: job.customer.userId,
          type: "JOB",
          title: "Job update",
          message:
            input.servicePath === "ESTIMATE_FIRST"
              ? "Your request has moved to estimate drafting."
              : input.servicePath === "EMERGENCY_DISPATCH"
                ? "Emergency dispatch is active and a technician is being routed."
                : "Your request is accepted and scheduled.",
          link: "/customer/jobs",
        },
      });
    }

    return updatedJob;
  });

  return NextResponse.json({
    data: {
      job: result,
      likelyMaterials: likely.materials,
      selectedVanReadiness,
      recommendedVan,
      alternatives: readiness.slice(1, 5),
    },
  });
}
