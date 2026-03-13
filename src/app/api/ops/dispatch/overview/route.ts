import { JobRequestStatus, JobStatus, MembershipRole, SubscriptionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";
import { calculateVanReadiness, getLikelyMaterialsForJob } from "@/lib/ops";

function sameDay(date: Date, compare: Date) {
  return (
    date.getFullYear() === compare.getFullYear() &&
    date.getMonth() === compare.getMonth() &&
    date.getDate() === compare.getDate()
  );
}

export async function GET() {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected." }, { status: 400 });
  }

  const now = new Date();
  const [requests, jobs, technicians, vans, subscriptions, threads] = await Promise.all([
    prisma.jobRequest.findMany({
      where: { organisationId: ctx.organisationId },
      include: {
        customer: true,
        property: true,
        linkedJob: true,
      },
      orderBy: { requestedAt: "desc" },
      take: 200,
    }),
    prisma.job.findMany({
      where: { organisationId: ctx.organisationId },
      include: {
        customer: true,
        property: true,
        technician: true,
        van: true,
      },
      orderBy: { scheduledAt: "asc" },
      take: 300,
    }),
    prisma.technician.findMany({
      where: { organisationId: ctx.organisationId },
      include: {
        jobs: {
          where: {
            status: {
              in: [
                JobStatus.SCHEDULED,
                JobStatus.TECHNICIAN_ASSIGNED,
                JobStatus.VAN_ASSIGNED,
                JobStatus.IN_PROGRESS,
              ],
            },
          },
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            status: true,
          },
        },
      },
    }),
    prisma.van.findMany({
      where: { organisationId: ctx.organisationId, status: "ACTIVE" },
      include: {
        assignedTechnician: true,
        inventoryItems: {
          select: {
            name: true,
            quantity: true,
          },
        },
      },
    }),
    prisma.subscription.findMany({
      where: { organisationId: ctx.organisationId, status: SubscriptionStatus.ACTIVE },
      include: { plan: true },
    }),
    prisma.chatThread.findMany({
      where: { organisationId: ctx.organisationId },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
  ]);

  const activeRequestStatuses = new Set<JobRequestStatus>([
    JobRequestStatus.NEW,
    JobRequestStatus.UNDER_REVIEW,
    JobRequestStatus.MORE_INFO_REQUESTED,
    JobRequestStatus.ESTIMATE_REQUIRED,
    JobRequestStatus.READY_TO_SCHEDULE,
    JobRequestStatus.EMERGENCY_DISPATCHED,
  ]);

  const incoming = requests.filter((request) => activeRequestStatuses.has(request.status));
  const awaitingEstimateApproval = jobs.filter((job) => job.status === JobStatus.ESTIMATE_SENT).length;
  const readyToSchedule = requests.filter((request) => request.status === JobRequestStatus.READY_TO_SCHEDULE).length;
  const emergencyQueue = requests.filter(
    (request) => request.isEmergency || request.status === JobRequestStatus.EMERGENCY_DISPATCHED,
  ).length;
  const slaRisk = requests.filter((request) => request.slaState === "CRITICAL" || request.slaState === "BREACHED")
    .length;

  const todayBoard = jobs
    .filter((job) => Boolean(job.scheduledAt) && sameDay(job.scheduledAt as Date, now))
    .map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      urgency: job.urgency,
      scheduledAt: job.scheduledAt,
      technician: job.technician?.displayName ?? "Unassigned",
      van: job.van?.name ?? "Unassigned",
      address: `${job.property.addressLine1}, ${job.property.city}`,
    }));

  const technicianAvailability = technicians.map((tech) => {
    const activeJobs = tech.jobs.length;
    const nextJob = tech.jobs
      .filter((job) => Boolean(job.scheduledAt))
      .sort((a, b) => (a.scheduledAt?.getTime() ?? 0) - (b.scheduledAt?.getTime() ?? 0))[0];

    return {
      id: tech.id,
      displayName: tech.displayName,
      status: activeJobs === 0 ? "IDLE" : activeJobs > 2 ? "BUSY" : "ACTIVE",
      jobsToday: activeJobs,
      nextAvailable:
        activeJobs === 0
          ? now.toISOString()
          : new Date((nextJob?.scheduledAt?.getTime() ?? now.getTime()) + 2 * 3600 * 1000).toISOString(),
      emergencyCapable: Boolean((tech.skills as { emergency?: boolean } | null)?.emergency) || activeJobs < 3,
      certifications:
        ((tech.skills as { categories?: string[] } | null)?.categories ?? []).slice(0, 4) ?? [],
      vanAssigned: vans.find((van) => van.assignedTechnicianId === tech.id)?.name ?? null,
    };
  });

  const topIncoming = incoming.slice(0, 8);
  const vanReadiness = topIncoming.map((request) => {
    const likely = getLikelyMaterialsForJob({
      title: request.title,
      issueCategory: request.serviceType,
      description: request.description,
    });
    const readiness = calculateVanReadiness(vans, likely.materials).slice(0, 3);
    return {
      requestId: request.id,
      title: request.title,
      serviceType: request.serviceType,
      best: readiness[0] ?? null,
      alternatives: readiness.slice(1),
      likelyMaterials: likely.materials,
    };
  });

  const subscriberIds = new Set(subscriptions.map((subscription) => subscription.customerId));
  const slaQueue = incoming
    .filter((request) => subscriberIds.has(request.customerId))
    .sort((a, b) => {
      const aTime = a.slaTargetAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const bTime = b.slaTargetAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    })
    .slice(0, 12)
    .map((request) => ({
      requestId: request.id,
      title: request.title,
      customer: request.customer.displayName,
      slaState: request.slaState,
      slaTargetAt: request.slaTargetAt,
      urgency: request.urgency,
    }));

  const activeChats = threads.map((thread) => ({
    id: thread.id,
    subject: thread.subject,
    updatedAt: thread.updatedAt,
    lastMessage: thread.messages[0]?.body ?? "No message yet",
  }));

  return NextResponse.json({
    data: {
      queues: {
        incoming: incoming.length,
        awaitingEstimateApproval,
        readyToSchedule,
        emergencyQueue,
        slaRisk,
      },
      todayBoard,
      technicianAvailability,
      vanReadiness,
      slaQueue,
      activeChats,
    },
  });
}
