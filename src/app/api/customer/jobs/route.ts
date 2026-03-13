import { JobUrgency, JobStatus, JobRequestStatus, MembershipRole, SlaState, SupplyMethod } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  propertyId: z.string().min(1),
  title: z.string().min(3),
  issueCategory: z.string().min(2),
  description: z.string().min(10),
  urgency: z.nativeEnum(JobUrgency).optional(),
  isEmergency: z.boolean().optional(),
  supplyMethod: z.nativeEnum(SupplyMethod).optional(),
  selectedProducts: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive().default(1),
        note: z.string().max(240).optional(),
      }),
    )
    .optional(),
  requestNotes: z.string().max(800).optional(),
});

export async function GET() {
  const ctx = await getApiContext([MembershipRole.CUSTOMER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const customer = await prisma.customer.findFirst({
    where: { organisationId: ctx.organisationId, userId: ctx.userId },
  });
  if (!customer) {
    return NextResponse.json({ data: [] });
  }
  const jobs = await prisma.job.findMany({
    where: { organisationId: ctx.organisationId, customerId: customer.id },
    include: {
      property: true,
      technician: true,
      jobRequest: {
        include: {
          selectedProducts: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  contractorSellPrice: true,
                },
              },
            },
          },
        },
      },
      estimate: { select: { id: true, status: true, total: true, validUntil: true } },
      invoice: { select: { id: true, status: true, total: true, issuedAt: true, dueAt: true } },
      statusHistory: {
        select: { id: true, toStatus: true, note: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    data: jobs.map((job) => ({
      ...job,
      isSubscriber: customer.isSubscriber,
    })),
  });
}

export async function POST(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.CUSTOMER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const input = schema.parse(await req.json());

  const customer = await prisma.customer.findFirst({
    where: { organisationId: ctx.organisationId, userId: ctx.userId },
  });
  if (!customer) {
    return NextResponse.json({ error: "Customer profile not found." }, { status: 404 });
  }

  const property = await prisma.property.findFirst({
    where: { id: input.propertyId, customerId: customer.id, organisationId: ctx.organisationId },
  });
  if (!property) {
    return NextResponse.json({ error: "Property not found." }, { status: 404 });
  }

  const urgency = input.isEmergency ? JobUrgency.EMERGENCY : input.urgency ?? JobUrgency.MEDIUM;
  const supplyMethod = input.supplyMethod ?? SupplyMethod.CONTRACTOR_SUPPLY;
  const slaTargetAt = customer.isSubscriber ? new Date(Date.now() + 6 * 3600 * 1000) : null;
  const slaState =
    !slaTargetAt || !customer.isSubscriber
      ? SlaState.SAFE
      : urgency === JobUrgency.EMERGENCY
        ? SlaState.CRITICAL
        : SlaState.AT_RISK;

  const result = await prisma.$transaction(async (tx) => {
    const job = await tx.job.create({
      data: {
        organisationId: ctx.organisationId!,
        customerId: customer.id,
        propertyId: property.id,
        title: input.title,
        issueCategory: input.issueCategory,
        description: input.description,
        urgency,
        isEmergency: Boolean(input.isEmergency),
        status: JobStatus.INCOMING_REQUEST,
        source: "CUSTOMER_APP",
        supplyMethod,
        slaTargetAt,
        slaState,
        aiSummary: `Intake from customer app. Supply method: ${supplyMethod.replaceAll("_", " ")}.`,
      },
    });

    const request = await tx.jobRequest.create({
      data: {
        organisationId: ctx.organisationId!,
        customerId: customer.id,
        propertyId: property.id,
        linkedJobId: job.id,
        title: input.title,
        serviceType: input.issueCategory,
        description: input.description,
        urgency,
        status: JobRequestStatus.NEW,
        supplyMethod,
        isEmergency: Boolean(input.isEmergency),
        subscriberPriority: customer.isSubscriber,
        aiSummary: job.aiSummary,
        suggestedUrgency: urgency,
        suggestedServiceType: input.issueCategory,
        suggestedMaterials: {
          template: "Initial customer intake",
          note: "Dispatch review will calculate likely materials.",
        },
        slaTargetAt,
        slaState,
        reviewNotes: input.requestNotes ?? null,
      },
    });

    if (input.selectedProducts?.length) {
      await tx.jobRequestProduct.createMany({
        data: input.selectedProducts.map((entry) => ({
          organisationId: ctx.organisationId!,
          requestId: request.id,
          productId: entry.productId,
          quantity: entry.quantity,
          note: entry.note,
        })),
      });
    }

    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        toStatus: JobStatus.INCOMING_REQUEST,
        changedById: ctx.userId,
        note: "Created from customer portal intake queue.",
      },
    });

    return { job, request };
  });

  return NextResponse.json({ data: result }, { status: 201 });
}
