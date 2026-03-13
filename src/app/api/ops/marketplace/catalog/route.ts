import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

function roundPrice(value: number, rule: string | null) {
  if (!rule || rule === "NEAREST_POUND") {
    return Math.round(value);
  }
  if (rule === "NEAREST_0_50") {
    return Math.round(value * 2) / 2;
  }
  if (rule === "NEAREST_0_99") {
    return Math.floor(value) + 0.99;
  }
  return Number(value.toFixed(2));
}

export async function GET(req: NextRequest) {
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

  const q = req.nextUrl.searchParams.get("q")?.trim();
  const categorySlug = req.nextUrl.searchParams.get("category");

  const [categories, products, rules] = await Promise.all([
    prisma.productCategory.findMany({
      where: {
        organisationId: ctx.organisationId,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: {
        organisationId: ctx.organisationId,
        active: true,
        ...(categorySlug ? { category: { slug: categorySlug } } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { brand: { contains: q, mode: "insensitive" } },
                { model: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        category: true,
        sources: true,
      },
      orderBy: { createdAt: "desc" },
      take: 240,
    }),
    prisma.companyMarkupRule.findMany({
      where: {
        organisationId: ctx.organisationId,
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const defaultRule = rules.find((rule) => !rule.categoryId && !rule.productId) ?? null;

  const data = products.map((product) => {
    const productRule = rules.find((rule) => rule.productId === product.id) ?? null;
    const categoryRule = rules.find((rule) => rule.categoryId === product.categoryId && !rule.productId) ?? null;
    const appliedRule = productRule ?? categoryRule ?? defaultRule;

    const sourceCost = Number(product.sourceCost);
    const explicitSell = Number(product.contractorSellPrice);
    const calculatedSell =
      explicitSell > 0
        ? explicitSell
        : roundPrice(sourceCost * (1 + Number(appliedRule?.markupPct ?? 0) / 100), appliedRule?.roundingRule ?? null);
    const marginAmount = calculatedSell - sourceCost;
    const marginPct = sourceCost > 0 ? (marginAmount / sourceCost) * 100 : 0;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      },
      brand: product.brand,
      model: product.model,
      finishColor: product.finishColor,
      dimensions: product.dimensions,
      availabilityStatus: product.availabilityStatus,
      sourceCost,
      sellPrice: Number(calculatedSell.toFixed(2)),
      marginAmount: Number(marginAmount.toFixed(2)),
      marginPct: Number(marginPct.toFixed(2)),
      vatRate: Number(product.vatRate),
      imagePath: product.imagePath,
      supplier: product.sources[0]
        ? {
            supplierName: product.sources[0].supplierName,
            supplierSku: product.sources[0].supplierSku,
            supplierUrl: product.sources[0].supplierUrl,
            supplierCost: Number(product.sources[0].supplierCost),
          }
        : null,
      appliedRule: appliedRule
        ? {
            id: appliedRule.id,
            ruleName: appliedRule.ruleName,
            markupPct: Number(appliedRule.markupPct),
            minimumMarginPct: Number(appliedRule.minimumMarginPct),
            roundingRule: appliedRule.roundingRule,
          }
        : null,
    };
  });

  return NextResponse.json({
    data: {
      categories,
      products: data,
    },
  });
}
