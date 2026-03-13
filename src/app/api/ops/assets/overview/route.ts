import { AssetStatus, MembershipRole } from "@prisma/client";
import { addDays } from "date-fns";
import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  const ctx = await getApiContext([
    MembershipRole.OWNER,
    MembershipRole.MANAGER,
    MembershipRole.TECHNICIAN,
    MembershipRole.CUSTOMER,
  ]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected." }, { status: 400 });
  }

  const customerScope =
    ctx.role === MembershipRole.CUSTOMER
      ? {
          customer: {
            userId: ctx.userId,
          },
        }
      : {};

  const assets = await prisma.propertyAsset.findMany({
    where: {
      organisationId: ctx.organisationId,
      ...customerScope,
    },
    include: {
      property: true,
      customer: true,
      product: true,
    },
    orderBy: { installationDate: "desc" },
    take: 500,
  });

  const byCategory = new Map<string, number>();
  const bySupplier = new Map<string, number>();
  for (const asset of assets) {
    byCategory.set(asset.category ?? asset.assetType, (byCategory.get(asset.category ?? asset.assetType) ?? 0) + 1);
    bySupplier.set(asset.supplierName ?? "Unknown", (bySupplier.get(asset.supplierName ?? "Unknown") ?? 0) + 1);
  }

  const now = new Date();
  const expiringWithin90Days = assets.filter((asset) => {
    if (!asset.warrantyExpiry) {
      return false;
    }
    return asset.warrantyExpiry >= now && asset.warrantyExpiry <= addDays(now, 90);
  });

  const replacementPipeline = assets.filter((asset) => {
    if (!asset.installationDate || !asset.expectedReplacementMonths) {
      return false;
    }
    const replacementDate = new Date(asset.installationDate);
    replacementDate.setMonth(replacementDate.getMonth() + asset.expectedReplacementMonths);
    return replacementDate <= addDays(now, 180);
  });

  return NextResponse.json({
    data: {
      totals: {
        assets: assets.length,
        active: assets.filter((asset) => asset.status === AssetStatus.ACTIVE).length,
        faulty: assets.filter((asset) => asset.status === AssetStatus.FAULTY).length,
        replaced: assets.filter((asset) => asset.status === AssetStatus.REPLACED).length,
        expiringWithin90Days: expiringWithin90Days.length,
        replacementPipeline: replacementPipeline.length,
      },
      byCategory: Array.from(byCategory.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      bySupplier: Array.from(bySupplier.entries())
        .map(([supplier, count]) => ({ supplier, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      expiringWithin90Days: expiringWithin90Days.slice(0, 12).map((asset) => ({
        id: asset.id,
        name: asset.name,
        property: `${asset.property.addressLine1}, ${asset.property.city}`,
        warrantyExpiry: asset.warrantyExpiry,
        customer: asset.customer.displayName,
      })),
      replacementPipeline: replacementPipeline.slice(0, 12).map((asset) => ({
        id: asset.id,
        name: asset.name,
        installationDate: asset.installationDate,
        expectedReplacementMonths: asset.expectedReplacementMonths,
        property: `${asset.property.addressLine1}, ${asset.property.city}`,
      })),
      assets: assets.slice(0, 150),
    },
  });
}
