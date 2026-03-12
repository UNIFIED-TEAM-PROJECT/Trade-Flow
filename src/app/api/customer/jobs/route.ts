import { JobUrgency, JobStatus, MembershipRole } from "@prisma/client";
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
    include: { property: true, technician: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: jobs });
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
  const job = await prisma.job.create({
    data: {
      organisationId: ctx.organisationId!,
      customerId: customer.id,
      propertyId: property.id,
      title: input.title,
      issueCategory: input.issueCategory,
      description: input.description,
      urgency,
      isEmergency: Boolean(input.isEmergency),
      status: JobStatus.LEAD,
      source: "CUSTOMER_APP",
      slaTargetAt: customer.isSubscriber ? new Date(Date.now() + 6 * 3600 * 1000) : null,
    },
  });

  await prisma.jobStatusHistory.create({
    data: {
      jobId: job.id,
      toStatus: JobStatus.LEAD,
      changedById: ctx.userId,
      note: "Created from customer portal.",
    },
  });

  return NextResponse.json({ data: job }, { status: 201 });
}
