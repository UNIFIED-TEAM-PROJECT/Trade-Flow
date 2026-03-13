import { JobRequestStatus, JobStatus, JobUrgency, MembershipRole, SlaState } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  action: z.enum([
    "ACCEPT",
    "REJECT",
    "REQUEST_INFO",
    "CONVERT_TO_ESTIMATE",
    "DISPATCH_EMERGENCY",
    "SCHEDULE_LATER",
  ]),
  note: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

function transitions(action: z.infer<typeof schema>["action"], currentStatus: JobStatus) {
  switch (action) {
    case "REJECT":
      return { jobStatus: JobStatus.REJECTED, requestStatus: JobRequestStatus.REJECTED };
    case "CONVERT_TO_ESTIMATE":
      return { jobStatus: JobStatus.ESTIMATE_DRAFTED, requestStatus: JobRequestStatus.ESTIMATE_REQUIRED };
    case "DISPATCH_EMERGENCY":
      return { jobStatus: JobStatus.TECHNICIAN_ASSIGNED, requestStatus: JobRequestStatus.EMERGENCY_DISPATCHED };
    case "SCHEDULE_LATER":
      return { jobStatus: JobStatus.SCHEDULED, requestStatus: JobRequestStatus.READY_TO_SCHEDULE };
    case "REQUEST_INFO":
      return { jobStatus: JobStatus.AWAITING_CUSTOMER_RESPONSE, requestStatus: JobRequestStatus.MORE_INFO_REQUESTED };
    case "ACCEPT":
      return {
        jobStatus: currentStatus === JobStatus.INCOMING_REQUEST ? JobStatus.UNDER_REVIEW : currentStatus,
        requestStatus: JobRequestStatus.ACCEPTED,
      };
    default:
      return { jobStatus: currentStatus, requestStatus: JobRequestStatus.UNDER_REVIEW };
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const input = schema.parse(await req.json());
  const job = await prisma.job.findFirst({
    where: { id: params.id, organisationId: ctx.organisationId },
    include: {
      jobRequest: true,
      customer: true,
      property: true,
    },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const next = transitions(input.action, job.status);

  const updated = await prisma.$transaction(async (tx) => {
    const data: Record<string, unknown> = {
      status: next.jobStatus,
    };
    if (input.action === "DISPATCH_EMERGENCY") {
      data.urgency = JobUrgency.EMERGENCY;
      data.isEmergency = true;
      data.scheduledAt = new Date();
      data.slaState = SlaState.CRITICAL;
    }
    if (input.scheduledAt) {
      data.scheduledAt = new Date(input.scheduledAt);
    }

    const updatedJob = await tx.job.update({
      where: { id: job.id },
      data,
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
          status: JobRequestStatus.UNDER_REVIEW,
          supplyMethod: job.supplyMethod,
          isEmergency: job.isEmergency,
          subscriberPriority: job.customer.isSubscriber,
          aiSummary: job.aiSummary,
          suggestedUrgency: job.urgency,
          suggestedServiceType: job.issueCategory,
          suggestedMaterials: {
            source: "backfilled_from_job",
          },
          slaTargetAt: job.slaTargetAt,
          slaState: job.slaState,
          requestedAt: job.createdAt,
        },
      }));

    await tx.jobRequest.update({
      where: { id: request.id },
      data: {
        status: next.requestStatus,
        reviewedAt: new Date(),
        reviewedById: ctx.userId,
        reviewNotes: input.note ?? undefined,
      },
    });

    await tx.jobStatusHistory.create({
      data: {
        jobId: job.id,
        fromStatus: job.status,
        toStatus: next.jobStatus,
        changedById: ctx.userId,
        note: input.note ?? `Review action applied: ${input.action.replaceAll("_", " ")}`,
      },
    });

    return updatedJob;
  });

  return NextResponse.json({ data: updated });
}
