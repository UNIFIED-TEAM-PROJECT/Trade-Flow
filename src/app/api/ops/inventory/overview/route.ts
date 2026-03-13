import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { subDays } from "date-fns";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected." }, { status: 400 });
  }

  const since = subDays(new Date(), 30);
  const vanId = req.nextUrl.searchParams.get("vanId");

  const [items, movements, vans] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: {
        organisationId: ctx.organisationId,
        ...(vanId ? { vanId } : {}),
      },
      include: {
        van: { select: { id: true, name: true, registration: true } },
        depot: { select: { id: true, name: true, code: true } },
        rack: { select: { id: true, label: true } },
        slot: { select: { id: true, label: true } },
      },
      orderBy: [{ vanId: "asc" }, { name: "asc" }],
    }),
    prisma.stockMovement.findMany({
      where: {
        organisationId: ctx.organisationId,
        createdAt: { gte: since },
      },
      include: {
        inventoryItem: { select: { id: true, name: true, vanId: true } },
        performedBy: { select: { id: true, firstName: true, lastName: true } },
        job: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.van.findMany({
      where: { organisationId: ctx.organisationId },
      include: { inventoryItems: true },
    }),
  ]);

  const totalStockValue = items.reduce((sum, item) => sum + Number(item.costPrice) * item.quantity, 0);
  const lowStockItems = items.filter((item) => item.quantity <= item.reorderLevel);
  const missingItems = items.filter((item) => item.quantity <= 0);
  const depotItems = items.filter((item) => Boolean(item.depotId) || !item.vanId);

  const usageByName = new Map<string, number>();
  const usageByVan = new Map<string, number>();
  const movementByType = new Map<string, number>();

  for (const movement of movements) {
    movementByType.set(movement.type, (movementByType.get(movement.type) ?? 0) + 1);
    if (movement.type === "OUT") {
      usageByName.set(
        movement.inventoryItem.name,
        (usageByName.get(movement.inventoryItem.name) ?? 0) + movement.quantity,
      );
      const key = movement.inventoryItem.vanId ?? "depot";
      usageByVan.set(key, (usageByVan.get(key) ?? 0) + movement.quantity);
    }
  }

  const mostUsedParts = Array.from(usageByName.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, quantity]) => ({ name, quantity }));

  const recentUsage = movements
    .filter((movement) => movement.type === "OUT")
    .slice(0, 10)
    .map((movement) => ({
      id: movement.id,
      createdAt: movement.createdAt,
      itemName: movement.inventoryItem.name,
      quantity: movement.quantity,
      note: movement.note,
      jobTitle: movement.job?.title ?? null,
    }));

  const vanOverview = vans.map((van) => {
    const stockValue = van.inventoryItems.reduce((sum, item) => sum + Number(item.costPrice) * item.quantity, 0);
    const lowStock = van.inventoryItems.filter((item) => item.quantity <= item.reorderLevel).length;
    return {
      vanId: van.id,
      vanName: van.name,
      registration: van.registration,
      stockValue,
      lowStock,
      usageLast30Days: usageByVan.get(van.id) ?? 0,
    };
  });

  return NextResponse.json({
    data: {
      totals: {
        totalStockValue,
        totalItems: items.length,
        lowStockCount: lowStockItems.length,
        missingItemsCount: missingItems.length,
        depotItemCount: depotItems.length,
      },
      lowStockItems: lowStockItems.slice(0, 20).map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        reorderLevel: item.reorderLevel,
        vanName: item.van?.name ?? item.depot?.name ?? "Depot",
        slotLabel: item.slot?.label ?? null,
      })),
      mostUsedParts,
      recentUsage,
      vanOverview,
      movementByType: Object.fromEntries(movementByType.entries()),
    },
  });
}
