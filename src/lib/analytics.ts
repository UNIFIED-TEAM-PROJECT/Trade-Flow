import { endOfDay, startOfDay, subDays } from "date-fns";
import { prisma } from "./db";

export async function getAnalyticsOverview(organisationId: string) {
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
  const todayEnd = endOfDay(new Date());

  const [jobs, invoices, estimates, subscriptions, inventory, snapshots] = await Promise.all([
    prisma.job.findMany({
      where: { organisationId, createdAt: { gte: thirtyDaysAgo, lte: todayEnd } },
      select: { status: true, technicianId: true, urgency: true, createdAt: true },
    }),
    prisma.invoice.findMany({
      where: { organisationId },
      select: { total: true, status: true, issuedAt: true },
    }),
    prisma.estimate.findMany({
      where: { organisationId },
      select: { status: true, total: true },
    }),
    prisma.subscription.findMany({
      where: { organisationId, status: "ACTIVE" },
      select: { id: true },
    }),
    prisma.inventoryItem.findMany({
      where: { organisationId },
      select: { id: true, quantity: true, reorderLevel: true },
    }),
    prisma.analyticsSnapshot.findMany({
      where: { organisationId },
      orderBy: { capturedAt: "asc" },
      take: 80,
    }),
  ]);

  const revenue = invoices.reduce((sum, item) => sum + Number(item.total), 0);
  const outstanding = invoices
    .filter((item) => item.status !== "PAID" && item.status !== "CANCELLED")
    .reduce((sum, item) => sum + Number(item.total), 0);
  const approvedEstimates = estimates.filter((item) => item.status === "APPROVED").length;
  const conversionRate = estimates.length ? (approvedEstimates / estimates.length) * 100 : 0;
  const lowStockCount = inventory.filter((item) => item.quantity <= item.reorderLevel).length;

  return {
    jobsByStatus: jobs.reduce<Record<string, number>>((acc, job) => {
      acc[job.status] = (acc[job.status] ?? 0) + 1;
      return acc;
    }, {}),
    technicianLoad: jobs.reduce<Record<string, number>>((acc, job) => {
      const key = job.technicianId ?? "Unassigned";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {}),
    revenue,
    outstanding,
    activeSubscriptions: subscriptions.length,
    lowStockCount,
    averageEstimateValue:
      estimates.length > 0
        ? estimates.reduce((sum, item) => sum + Number(item.total), 0) / estimates.length
        : 0,
    estimateConversionRate: conversionRate,
    trend: snapshots.map((item) => ({
      metric: item.metric,
      value: Number(item.value),
      capturedAt: item.capturedAt,
    })),
  };
}
