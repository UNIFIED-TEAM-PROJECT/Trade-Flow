import { MembershipRole, StockMovementType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  jobId: z.string().min(1),
  itemCode: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.TECHNICIAN]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const input = schema.parse(await req.json());

  const job = await prisma.job.findFirst({
    where: { id: input.jobId, organisationId: ctx.organisationId },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const item = await prisma.inventoryItem.findFirst({
    where: {
      organisationId: ctx.organisationId,
      OR: [{ barcode: input.itemCode }, { qrCode: input.itemCode }, { sku: input.itemCode }],
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
  }

  if (item.quantity < input.quantity) {
    return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedItem = await tx.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: { decrement: input.quantity } },
    });

    const movement = await tx.stockMovement.create({
      data: {
        organisationId: ctx.organisationId!,
        inventoryItemId: item.id,
        jobId: job.id,
        fromSlotId: item.slotId,
        performedById: ctx.userId,
        type: StockMovementType.OUT,
        quantity: input.quantity,
        codeUsed: input.itemCode,
        note: input.note ?? "Used for job material",
      },
    });

    await tx.jobMaterial.create({
      data: {
        organisationId: ctx.organisationId!,
        jobId: job.id,
        inventoryItemId: item.id,
        description: item.name,
        quantity: String(input.quantity),
        unit: item.unit,
        unitPrice: item.costPrice,
        vatRate: "20.00",
        total: (Number(item.costPrice) * input.quantity).toFixed(2),
      },
    });

    return { item: updatedItem, movement };
  });

  return NextResponse.json({ data: result });
}
