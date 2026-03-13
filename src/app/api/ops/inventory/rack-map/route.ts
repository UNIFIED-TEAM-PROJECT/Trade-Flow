import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
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

  const requestedVanId = req.nextUrl.searchParams.get("vanId");

  const van =
    (requestedVanId
      ? await prisma.van.findFirst({
          where: { id: requestedVanId, organisationId: ctx.organisationId },
        })
      : null) ??
    (await prisma.van.findFirst({
      where: { organisationId: ctx.organisationId },
      orderBy: { name: "asc" },
    }));

  if (!van) {
    return NextResponse.json({ data: null });
  }

  const racks = await prisma.rack.findMany({
    where: { organisationId: ctx.organisationId, vanId: van.id },
    include: {
      slots: {
        include: {
          inventoryItems: {
            select: {
              id: true,
              name: true,
              sku: true,
              quantity: true,
              reorderLevel: true,
              unit: true,
              barcode: true,
              qrCode: true,
              updatedAt: true,
            },
            orderBy: { name: "asc" },
          },
        },
        orderBy: { label: "asc" },
      },
    },
    orderBy: { label: "asc" },
  });

  return NextResponse.json({
    data: {
      van: {
        id: van.id,
        name: van.name,
        registration: van.registration,
        identifier: van.identifier,
      },
      racks: racks.map((rack) => ({
        id: rack.id,
        label: rack.label,
        description: rack.description,
        slots: rack.slots.map((slot) => ({
          id: slot.id,
          label: slot.label,
          category: slot.category,
          notes: slot.notes,
          items: slot.inventoryItems.map((item) => ({
            ...item,
            lowStock: item.quantity <= item.reorderLevel,
          })),
        })),
      })),
    },
  });
}
