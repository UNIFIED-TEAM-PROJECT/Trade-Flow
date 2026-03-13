import { MembershipRole, StockMovementType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  action: z.enum([
    "RESTOCK_DEPOT_TO_VAN",
    "TRANSFER_VAN_TO_VAN",
    "RETURN_TO_DEPOT",
    "DEDUCT_ON_JOB",
    "URGENT_PURCHASE",
    "MARK_DAMAGED",
    "MARK_LOST",
    "AUDIT_ADJUSTMENT",
  ]),
  inventoryItemId: z.string().optional(),
  quantity: z.number().int().positive().optional(),
  targetVanId: z.string().optional(),
  targetDepotId: z.string().optional(),
  targetSlotId: z.string().optional(),
  targetItemId: z.string().optional(),
  targetQuantity: z.number().int().nonnegative().optional(),
  jobId: z.string().optional(),
  note: z.string().optional(),
  name: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.number().nonnegative().optional(),
});

function getSafeTransferSku(baseSku: string, targetKey: string) {
  return `${baseSku}-${targetKey}`.slice(0, 64);
}

export async function GET(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const organisationId = ctx.organisationId;
  if (!organisationId) {
    return NextResponse.json({ error: "No organisation selected." }, { status: 400 });
  }

  const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 150), 500);
  const jobId = req.nextUrl.searchParams.get("jobId");
  const itemId = req.nextUrl.searchParams.get("inventoryItemId");

  const data = await prisma.stockMovement.findMany({
    where: {
      organisationId,
      ...(jobId ? { jobId } : {}),
      ...(itemId ? { inventoryItemId: itemId } : {}),
    },
    include: {
      inventoryItem: {
        select: {
          id: true,
          name: true,
          sku: true,
          van: {
            select: {
              id: true,
              name: true,
              registration: true,
            },
          },
          depot: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          slot: {
            select: {
              id: true,
              label: true,
            },
          },
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
      performedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take,
  });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const organisationId = ctx.organisationId;
  if (!organisationId) {
    return NextResponse.json({ error: "No organisation selected." }, { status: 400 });
  }

  const input = schema.parse(await req.json());

  const result = await prisma.$transaction(async (tx) => {
    const getItem = async (itemId?: string) => {
      if (!itemId) {
        return null;
      }
      return tx.inventoryItem.findFirst({
        where: {
          id: itemId,
          organisationId,
        },
      });
    };

    const source = await getItem(input.inventoryItemId);
    const quantity = input.quantity ?? 0;
    const targetDepot =
      (input.targetDepotId
        ? await tx.depot.findFirst({
            where: { id: input.targetDepotId, organisationId },
          })
        : null) ??
      (await tx.depot.findFirst({
        where: { organisationId, isPrimary: true },
      })) ??
      null;

    if (input.action === "DEDUCT_ON_JOB") {
      if (!source || !input.jobId || quantity <= 0) {
        throw new Error("inventoryItemId, jobId, and quantity are required.");
      }
      if (source.quantity < quantity) {
        throw new Error("Insufficient stock for deduction.");
      }
      const job = await tx.job.findFirst({
        where: { id: input.jobId, organisationId },
      });
      if (!job) {
        throw new Error("Job not found.");
      }

      const updatedItem = await tx.inventoryItem.update({
        where: { id: source.id },
        data: { quantity: { decrement: quantity } },
      });

      const movement = await tx.stockMovement.create({
        data: {
          organisationId,
          inventoryItemId: source.id,
          jobId: job.id,
          fromSlotId: source.slotId,
          performedById: ctx.userId,
          type: StockMovementType.OUT,
          quantity,
          codeUsed: source.barcode ?? source.qrCode ?? source.sku,
          note: input.note ?? "Issued to job",
        },
      });

      await tx.jobMaterial.create({
        data: {
          organisationId,
          jobId: job.id,
          inventoryItemId: source.id,
          description: source.name,
          quantity: String(quantity),
          unit: source.unit,
          unitPrice: source.costPrice,
          vatRate: "20.00",
          total: (Number(source.costPrice) * quantity).toFixed(2),
        },
      });

      return { action: input.action, source: updatedItem, movement };
    }

    if (input.action === "URGENT_PURCHASE") {
      if (quantity <= 0) {
        throw new Error("Quantity is required.");
      }

      const baseName = input.name ?? source?.name;
      if (!baseName) {
        throw new Error("name or inventoryItemId is required for urgent purchase.");
      }

      let target = source;
      if (!target) {
        const generatedSku = input.sku ?? `PUR-${Date.now()}`;
        target = await tx.inventoryItem.create({
          data: {
            organisationId,
            vanId: input.targetVanId ?? null,
            depotId: input.targetVanId ? null : targetDepot?.id ?? null,
            slotId: input.targetSlotId ?? null,
            name: baseName,
            sku: generatedSku,
            category: input.category ?? "Purchased",
            quantity: 0,
            costPrice: (input.costPrice ?? 0).toFixed(2),
            reorderLevel: 1,
            unit: "pcs",
          },
        });
      }

      const updated = await tx.inventoryItem.update({
        where: { id: target.id },
        data: { quantity: { increment: quantity } },
      });

      const movement = await tx.stockMovement.create({
        data: {
          organisationId,
          inventoryItemId: target.id,
          performedById: ctx.userId,
          type: StockMovementType.IN,
          quantity,
          note: input.note ?? "Urgent purchased material received",
        },
      });

      return { action: input.action, source: updated, movement };
    }

    if (!source) {
      throw new Error("inventoryItemId is required.");
    }

    if (input.action === "MARK_DAMAGED" || input.action === "MARK_LOST") {
      if (quantity <= 0) {
        throw new Error("Quantity is required.");
      }
      if (source.quantity < quantity) {
        throw new Error("Insufficient stock.");
      }

      const updated = await tx.inventoryItem.update({
        where: { id: source.id },
        data: { quantity: { decrement: quantity } },
      });
      const movement = await tx.stockMovement.create({
        data: {
          organisationId,
          inventoryItemId: source.id,
          performedById: ctx.userId,
          type: StockMovementType.ADJUSTMENT,
          quantity: -quantity,
          note: input.note ?? (input.action === "MARK_DAMAGED" ? "Damaged stock logged" : "Lost stock logged"),
        },
      });
      return { action: input.action, source: updated, movement };
    }

    if (input.action === "AUDIT_ADJUSTMENT") {
      if (typeof input.targetQuantity !== "number") {
        throw new Error("targetQuantity is required for audit adjustment.");
      }
      const delta = input.targetQuantity - source.quantity;
      const updated = await tx.inventoryItem.update({
        where: { id: source.id },
        data: { quantity: input.targetQuantity },
      });
      const movement = await tx.stockMovement.create({
        data: {
          organisationId,
          inventoryItemId: source.id,
          performedById: ctx.userId,
          type: StockMovementType.ADJUSTMENT,
          quantity: delta,
          note: input.note ?? "Inventory count correction",
        },
      });
      return { action: input.action, source: updated, movement };
    }

    if (quantity <= 0) {
      throw new Error("Quantity is required.");
    }
    if (source.quantity < quantity) {
      throw new Error("Insufficient stock.");
    }

    let targetVanId: string | null = null;
    let targetDepotId: string | null = null;
    if (input.action === "RESTOCK_DEPOT_TO_VAN" || input.action === "TRANSFER_VAN_TO_VAN") {
      if (!input.targetVanId) {
        throw new Error("targetVanId is required.");
      }
      targetVanId = input.targetVanId;
    }
    if (input.action === "RETURN_TO_DEPOT") {
      targetVanId = null;
      targetDepotId = targetDepot?.id ?? null;
    }
    if (input.action === "RESTOCK_DEPOT_TO_VAN") {
      targetDepotId = null;
    }

    let targetItem = input.targetItemId ? await getItem(input.targetItemId) : null;
    if (!targetItem) {
      targetItem = await tx.inventoryItem.findFirst({
        where: {
          organisationId,
          vanId: targetVanId,
          depotId: targetDepotId,
          slotId: input.targetSlotId ?? null,
          name: source.name,
        },
      });
    }

    if (!targetItem) {
      const targetKey = targetVanId ? targetVanId.slice(-5) : "DEPOT";
      targetItem = await tx.inventoryItem.create({
        data: {
          organisationId,
          vanId: targetVanId,
          depotId: targetDepotId,
          slotId: input.targetSlotId ?? null,
          rackId: null,
          supplierId: source.supplierId,
          name: source.name,
          category: source.category,
          sku: getSafeTransferSku(source.sku, targetKey),
          quantity: 0,
          unit: source.unit,
          costPrice: source.costPrice,
          reorderLevel: source.reorderLevel,
          barcode: source.barcode,
          qrCode: source.qrCode,
          notes: source.notes,
        },
      });
    }

    const [updatedSource, updatedTarget] = await Promise.all([
      tx.inventoryItem.update({
        where: { id: source.id },
        data: { quantity: { decrement: quantity } },
      }),
      tx.inventoryItem.update({
        where: { id: targetItem.id },
        data: { quantity: { increment: quantity } },
      }),
    ]);

    const movement = await tx.stockMovement.create({
      data: {
        organisationId,
        inventoryItemId: source.id,
        fromDepotId: source.depotId,
        toDepotId: updatedTarget.depotId,
        fromSlotId: source.slotId,
        toSlotId: updatedTarget.slotId,
        performedById: ctx.userId,
        type: StockMovementType.TRANSFER,
        quantity,
        note:
          input.note ??
          (input.action === "RESTOCK_DEPOT_TO_VAN"
            ? `Restocked van from depot (${updatedTarget.name})`
            : input.action === "RETURN_TO_DEPOT"
              ? "Returned stock to depot"
              : "Van-to-van transfer"),
      },
    });

    return {
      action: input.action,
      source: updatedSource,
      target: updatedTarget,
      movement,
    };
  });

  return NextResponse.json({ data: result });
}
