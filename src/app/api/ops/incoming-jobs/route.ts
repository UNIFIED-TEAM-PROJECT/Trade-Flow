import { JobRequestStatus, JobUrgency, MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  calculateDistanceMiles,
  calculateVanReadiness,
  estimateTravelMinutes,
  getLikelyMaterialsForJob,
  getSlaUrgencyBadge,
} from "@/lib/ops";

const INCOMING_STATUSES: JobRequestStatus[] = [
  JobRequestStatus.NEW,
  JobRequestStatus.UNDER_REVIEW,
  JobRequestStatus.MORE_INFO_REQUESTED,
  JobRequestStatus.ESTIMATE_REQUIRED,
  JobRequestStatus.READY_TO_SCHEDULE,
  JobRequestStatus.EMERGENCY_DISPATCHED,
];

export async function GET() {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected." }, { status: 400 });
  }

  const [requests, technicians, vans] = await Promise.all([
    prisma.jobRequest.findMany({
      where: {
        organisationId: ctx.organisationId,
        status: { in: INCOMING_STATUSES },
      },
      include: {
        customer: true,
        property: true,
        linkedJob: true,
        selectedProducts: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                contractorSellPrice: true,
                sourceCost: true,
              },
            },
          },
        },
      },
      orderBy: [{ isEmergency: "desc" }, { requestedAt: "asc" }],
      take: 120,
    }),
    prisma.technician.findMany({
      where: { organisationId: ctx.organisationId },
      include: {
        jobs: {
          where: {
            status: {
              in: ["SCHEDULED", "TECHNICIAN_ASSIGNED", "VAN_ASSIGNED", "IN_PROGRESS"],
            },
          },
          select: { id: true },
        },
      },
    }),
    prisma.van.findMany({
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
    }),
  ]);

  const subscriptionMap = new Map(
    (
      await prisma.subscription.findMany({
        where: {
          organisationId: ctx.organisationId,
          status: "ACTIVE",
          customerId: { in: requests.map((request) => request.customerId) },
        },
        include: { plan: true },
      })
    ).map((subscription) => [subscription.customerId, subscription]),
  );

  const queue = requests.map((request) => {
    const likely = getLikelyMaterialsForJob({
      title: request.title,
      issueCategory: request.serviceType,
      description: request.description,
    });
    const vanScores = calculateVanReadiness(vans, likely.materials);
    const bestVan = vanScores[0] ?? null;
    const matchedVan = vans.find((van) => van.id === bestVan?.vanId) ?? null;

    const suggestedTech =
      (matchedVan?.assignedTechnicianId
        ? technicians.find((tech) => tech.id === matchedVan.assignedTechnicianId)
        : undefined) ??
      technicians
        .filter((tech) => {
          const categories = Array.isArray((tech.skills as { categories?: string[] } | null)?.categories)
            ? (((tech.skills as { categories?: string[] } | null)?.categories as string[]) ?? [])
            : [];
          if (categories.length === 0) {
            return true;
          }
          return categories.some((category) =>
            `${request.serviceType} ${request.title}`.toLowerCase().includes(String(category).toLowerCase()),
          );
        })
        .sort((a, b) => a.jobs.length - b.jobs.length)[0] ??
      null;

    const subscription = subscriptionMap.get(request.customerId);
    const fallbackSlaTarget = subscription
      ? new Date(Date.now() + (subscription.plan.responseSlaHours || 8) * 3600 * 1000)
      : null;
    const sla = getSlaUrgencyBadge(
      Boolean(subscription),
      request.urgency as JobUrgency,
      request.slaTargetAt ?? fallbackSlaTarget,
    );

    const travelMinutes = estimateTravelMinutes(
      calculateDistanceMiles(
        { latitude: matchedVan?.latitude, longitude: matchedVan?.longitude },
        { latitude: request.property.latitude, longitude: request.property.longitude },
      ),
      request.urgency as JobUrgency,
    );

    const selectedProducts = request.selectedProducts.map((entry) => ({
      id: entry.product.id,
      name: entry.product.name,
      quantity: entry.quantity,
      sellPrice: Number(entry.product.contractorSellPrice),
      sourceCost: Number(entry.product.sourceCost),
    }));

    return {
      id: request.linkedJobId ?? request.id,
      requestId: request.id,
      jobId: request.linkedJobId,
      title: request.title,
      serviceType: request.serviceType,
      urgency: request.urgency,
      status: request.status,
      isEmergency: request.isEmergency,
      supplyMethod: request.supplyMethod,
      requestedAt: request.requestedAt,
      createdAt: request.createdAt,
      customer: {
        id: request.customer.id,
        displayName: request.customer.displayName,
        email: request.customer.email,
        isSubscriber: Boolean(subscription),
      },
      property: {
        id: request.property.id,
        address: `${request.property.addressLine1}, ${request.property.city}, ${request.property.postcode}`,
      },
      aiTriage: {
        template: likely.templateLabel,
        likelyMaterials: likely.materials,
        estimatedDurationMinutes: likely.estimatedDurationMinutes,
      },
      selectedProducts,
      sla: {
        label: sla.label,
        secondsRemaining: sla.secondsRemaining,
        severity: sla.severity,
      },
      suggestion: {
        technician: suggestedTech
          ? {
              id: suggestedTech.id,
              displayName: suggestedTech.displayName,
              workloadCount: suggestedTech.jobs.length,
            }
          : null,
        van: bestVan
          ? {
              vanId: bestVan.vanId,
              vanName: bestVan.vanName,
              registration: bestVan.registration,
              readinessScore: bestVan.readinessScore,
              missing: bestVan.missing,
              inStock: bestVan.inStock,
            }
          : null,
        travelMinutes,
        materialReadinessPct: bestVan?.readinessScore ?? 0,
      },
      availableActions: [
        "ACCEPT",
        "REJECT",
        "REQUEST_INFO",
        "CONVERT_TO_ESTIMATE",
        "DISPATCH_EMERGENCY",
        "SCHEDULE_LATER",
      ],
    };
  });

  return NextResponse.json({ data: queue });
}
