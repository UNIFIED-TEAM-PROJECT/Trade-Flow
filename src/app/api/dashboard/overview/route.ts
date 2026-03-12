import { MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected" }, { status: 400 });
  }

  const orgId = ctx.organisationId;
  const now = new Date();

  const [
    activeJobs,
    estimatesAwaiting,
    upcomingJobs,
    vans,
    lowStockItems,
    outstandingInvoices,
    invoicesPaid,
    subscribers,
    unreadChats,
    jobsByTech,
  ] = await Promise.all([
    prisma.job.count({
      where: { organisationId: orgId, status: { in: ["SCHEDULED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS"] } },
    }),
    prisma.estimate.count({
      where: { organisationId: orgId, status: "SENT" },
    }),
    prisma.job.count({
      where: {
        organisationId: orgId,
        scheduledAt: { gte: now },
        status: { in: ["SCHEDULED", "TECHNICIAN_ASSIGNED"] },
      },
    }),
    prisma.van.groupBy({
      by: ["status"],
      where: { organisationId: orgId },
      _count: true,
    }),
    prisma.inventoryItem.findMany({
      where: { organisationId: orgId },
      select: { quantity: true, reorderLevel: true },
    }),
    prisma.invoice.aggregate({
      where: { organisationId: orgId, status: { not: "PAID" } },
      _sum: { total: true },
    }),
    prisma.invoice.aggregate({
      where: { organisationId: orgId, status: "PAID" },
      _sum: { total: true },
    }),
    prisma.subscription.count({
      where: { organisationId: orgId, status: "ACTIVE" },
    }),
    prisma.chatMessage.count({
      where: {
        organisationId: orgId,
        createdAt: { gte: new Date(Date.now() - 12 * 3600 * 1000) },
      },
    }),
    prisma.job.groupBy({
      by: ["technicianId"],
      where: { organisationId: orgId },
      _count: true,
    }),
  ]);

  const lowStock = lowStockItems.filter((item) => item.quantity <= item.reorderLevel).length;

  return NextResponse.json({
    data: {
      activeJobs,
      estimatesAwaiting,
      upcomingJobs,
      vanStatuses: vans.map((v) => ({ status: v.status, count: v._count })),
      lowStock,
      outstandingInvoices: Number(outstandingInvoices._sum.total ?? 0),
      revenueSummary: Number(invoicesPaid._sum.total ?? 0),
      subscribers,
      slaResponseMetric: "94%",
      unreadChats,
      technicianWorkload: jobsByTech,
    },
  });
}
