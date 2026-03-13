import { JobRequestStatus, MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const ACTIVE_REQUEST_STATUSES: JobRequestStatus[] = [
  JobRequestStatus.NEW,
  JobRequestStatus.UNDER_REVIEW,
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

  const [vans, requests] = await Promise.all([
    prisma.van.findMany({
      where: { organisationId: ctx.organisationId },
      include: {
        locations: {
          orderBy: { recordedAt: "desc" },
          take: 6,
        },
        jobs: {
          where: {
            status: {
              in: ["SCHEDULED", "TECHNICIAN_ASSIGNED", "VAN_ASSIGNED", "IN_PROGRESS"],
            },
          },
          select: {
            id: true,
            title: true,
            status: true,
            scheduledAt: true,
          },
          orderBy: { scheduledAt: "asc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.jobRequest.findMany({
      where: {
        organisationId: ctx.organisationId,
        status: { in: ACTIVE_REQUEST_STATUSES },
      },
      include: {
        property: true,
      },
      orderBy: [{ isEmergency: "desc" }, { requestedAt: "asc" }],
      take: 60,
    }),
  ]);

  return NextResponse.json({
    data: {
      vans: vans.map((van) => ({
        id: van.id,
        name: van.name,
        registration: van.registration,
        status: van.status,
        latitude: van.latitude,
        longitude: van.longitude,
        currentLocationLabel: van.currentLocationLabel,
        jobs: van.jobs,
        route: van.locations
          .slice()
          .reverse()
          .map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
            label: point.label,
            recordedAt: point.recordedAt,
          })),
      })),
      requests: requests
        .filter((request) => request.property.latitude && request.property.longitude)
        .map((request) => ({
          id: request.id,
          title: request.title,
          urgency: request.urgency,
          isEmergency: request.isEmergency,
          latitude: request.property.latitude,
          longitude: request.property.longitude,
          address: `${request.property.addressLine1}, ${request.property.city}`,
        })),
    },
  });
}
