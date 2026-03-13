import { addDays, endOfDay, startOfDay, subDays } from "date-fns";
import { prisma } from "./db";

export async function getAnalyticsOverview(organisationId: string) {
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30));
  const todayEnd = endOfDay(new Date());

  const [jobs, invoices, estimates, subscriptions, inventory, snapshots, movements, vans, assets] = await Promise.all([
    prisma.job.findMany({
      where: { organisationId, createdAt: { gte: thirtyDaysAgo, lte: todayEnd } },
      select: {
        id: true,
        status: true,
        technicianId: true,
        vanId: true,
        urgency: true,
        issueCategory: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
        slaTargetAt: true,
        customerId: true,
      },
    }),
    prisma.invoice.findMany({
      where: { organisationId },
      select: {
        total: true,
        status: true,
        issuedAt: true,
        job: {
          select: {
            issueCategory: true,
          },
        },
        lineItems: {
          select: {
            quantity: true,
            unitPrice: true,
            product: {
              select: {
                id: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                sourceCost: true,
              },
            },
          },
        },
      },
    }),
    prisma.estimate.findMany({
      where: { organisationId },
      select: { status: true, total: true },
    }),
    prisma.subscription.findMany({
      where: { organisationId, status: "ACTIVE" },
      include: { plan: true },
    }),
    prisma.inventoryItem.findMany({
      where: { organisationId },
      select: { id: true, quantity: true, reorderLevel: true, costPrice: true },
    }),
    prisma.analyticsSnapshot.findMany({
      where: { organisationId },
      orderBy: { capturedAt: "asc" },
      take: 80,
    }),
    prisma.stockMovement.findMany({
      where: { organisationId, createdAt: { gte: thirtyDaysAgo } },
      include: {
        inventoryItem: {
          select: {
            vanId: true,
            costPrice: true,
          },
        },
      },
    }),
    prisma.van.findMany({
      where: { organisationId },
      select: { id: true, status: true },
    }),
    prisma.propertyAsset.findMany({
      where: { organisationId },
      select: {
        id: true,
        category: true,
        status: true,
        installationDate: true,
        expectedReplacementMonths: true,
        warrantyExpiry: true,
      },
    }),
  ]);

  const revenue = invoices.reduce((sum, item) => sum + Number(item.total), 0);
  const outstanding = invoices
    .filter((item) => item.status !== "PAID" && item.status !== "CANCELLED")
    .reduce((sum, item) => sum + Number(item.total), 0);
  const approvedEstimates = estimates.filter((item) => item.status === "APPROVED").length;
  const conversionRate = estimates.length ? (approvedEstimates / estimates.length) * 100 : 0;
  const lowStockCount = inventory.filter((item) => item.quantity <= item.reorderLevel).length;
  const activeVans = vans.filter((van) => van.status === "ACTIVE").length;
  const vansWithAssignedJobs = new Set(
    jobs
      .filter((job) =>
        ["SCHEDULED", "TECHNICIAN_ASSIGNED", "IN_PROGRESS", "AWAITING_MATERIALS"].includes(job.status),
      )
      .map((job) => job.vanId)
      .filter(Boolean),
  ).size;

  const usageByVan = movements.reduce<Record<string, number>>((acc, movement) => {
    if (movement.type !== "OUT") {
      return acc;
    }
    const key = movement.inventoryItem.vanId ?? "depot";
    acc[key] = (acc[key] ?? 0) + movement.quantity;
    return acc;
  }, {});

  const stockShrinkageLoss = movements
    .filter((movement) => {
      const note = (movement.note ?? "").toLowerCase();
      return (
        movement.type === "ADJUSTMENT" &&
        (note.includes("damaged") || note.includes("lost") || note.includes("shrinkage"))
      );
    })
    .reduce((sum, movement) => sum + Math.abs(movement.quantity) * Number(movement.inventoryItem.costPrice), 0);

  const profitableJobTypeMap = invoices.reduce<Record<string, number>>((acc, invoice) => {
    const key = invoice.job?.issueCategory ?? "Uncategorised";
    acc[key] = (acc[key] ?? 0) + Number(invoice.total);
    return acc;
  }, {});
  const profitableJobTypes = Object.entries(profitableJobTypeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([category, total]) => ({ category, total }));

  const subscriberJobs = jobs.filter((job) => job.slaTargetAt);
  const slaCompliant = subscriberJobs.filter((job) => job.completedAt && job.completedAt <= (job.slaTargetAt as Date)).length;
  const slaCompliancePct = subscriberJobs.length ? (slaCompliant / subscriberJobs.length) * 100 : 100;

  const emergencyResponseMinutes = (() => {
    const emergencies = jobs.filter((job) => job.urgency === "EMERGENCY" && job.startedAt);
    if (emergencies.length === 0) {
      return 0;
    }
    const totalMinutes = emergencies.reduce((sum, job) => {
      const startedAt = job.startedAt as Date;
      return sum + Math.max(0, (startedAt.getTime() - job.createdAt.getTime()) / 60000);
    }, 0);
    return totalMinutes / emergencies.length;
  })();

  const subscriptionRevenue = subscriptions.reduce((sum, subscription) => {
    if (subscription.plan.monthlyPrice) {
      return sum + Number(subscription.plan.monthlyPrice);
    }
    if (subscription.plan.yearlyPrice) {
      return sum + Number(subscription.plan.yearlyPrice) / 12;
    }
    return sum;
  }, 0);

  const jobsByCustomer = jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.customerId] = (acc[job.customerId] ?? 0) + 1;
    return acc;
  }, {});
  const recurringCustomersCount = Object.values(jobsByCustomer).filter((count) => count > 1).length;
  const oneOffCustomersCount = Object.values(jobsByCustomer).filter((count) => count <= 1).length;

  const productSalesByCategoryMap: Record<string, number> = {};
  const grossMarginByCategoryMap: Record<string, number> = {};
  let markupRevenue = 0;
  for (const invoice of invoices) {
    for (const lineItem of invoice.lineItems) {
      if (!lineItem.product?.category?.name) {
        continue;
      }
      const category = lineItem.product.category.name;
      const quantity = Number(lineItem.quantity);
      const lineRevenue = quantity * Number(lineItem.unitPrice);
      const lineCost = quantity * Number(lineItem.product.sourceCost ?? 0);
      productSalesByCategoryMap[category] = (productSalesByCategoryMap[category] ?? 0) + lineRevenue;
      grossMarginByCategoryMap[category] = (grossMarginByCategoryMap[category] ?? 0) + (lineRevenue - lineCost);
      markupRevenue += lineRevenue - lineCost;
    }
  }
  const productSalesByCategory = Object.entries(productSalesByCategoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);
  const grossMarginByProductCategory = Object.entries(grossMarginByCategoryMap)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  const now = new Date();
  const assetsNearingWarrantyExpiry = assets.filter(
    (asset) => asset.warrantyExpiry && asset.warrantyExpiry >= now && asset.warrantyExpiry <= addDays(now, 90),
  ).length;
  const replacementOpportunityPipeline = assets.filter((asset) => {
    if (!asset.installationDate || !asset.expectedReplacementMonths) {
      return false;
    }
    const replacementDate = new Date(asset.installationDate);
    replacementDate.setMonth(replacementDate.getMonth() + asset.expectedReplacementMonths);
    return replacementDate <= addDays(now, 180);
  }).length;

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
    estimateApprovalRate: conversionRate,
    vanUtilisationPct: activeVans ? (vansWithAssignedJobs / activeVans) * 100 : 0,
    stockUsageByVan: usageByVan,
    stockShrinkageLoss,
    profitableJobTypes,
    slaCompliancePct,
    emergencyResponseMinutes,
    subscriptionRevenue,
    recurringCustomersCount,
    oneOffCustomersCount,
    productSalesByCategory,
    grossMarginByProductCategory,
    markupRevenue,
    installedAssetCount: assets.length,
    assetsNearingWarrantyExpiry,
    replacementOpportunityPipeline,
    trend: snapshots.map((item) => ({
      metric: item.metric,
      value: Number(item.value),
      capturedAt: item.capturedAt,
    })),
  };
}
