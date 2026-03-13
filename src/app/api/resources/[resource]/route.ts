import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getApiContext, getTenantWhere, withApiErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/db";
import { getResourceConfig } from "@/lib/resource-config";

function getRoleScope(resource: string, ctx: { role?: MembershipRole; userId: string }) {
  if (ctx.role === MembershipRole.CUSTOMER) {
    if (resource === "customers") {
      return { userId: ctx.userId };
    }
    if (resource === "jobs") {
      return { customer: { userId: ctx.userId } };
    }
    if (resource === "job-requests") {
      return { customer: { userId: ctx.userId } };
    }
    if (resource === "properties") {
      return { customer: { userId: ctx.userId } };
    }
    if (resource === "property-assets") {
      return { customer: { userId: ctx.userId } };
    }
    if (resource === "asset-documents" || resource === "asset-photos" || resource === "asset-status-history") {
      return { asset: { customer: { userId: ctx.userId } } };
    }
    if (resource === "products" || resource === "product-categories") {
      return {};
    }
    if (resource === "estimates" || resource === "invoices" || resource === "subscriptions") {
      return { customer: { userId: ctx.userId } };
    }
    if (resource === "chat-threads") {
      return { customer: { userId: ctx.userId } };
    }
    return { id: "__none__" };
  }

  if (ctx.role === MembershipRole.TECHNICIAN) {
    if (resource === "jobs") {
      return { technician: { userId: ctx.userId } };
    }
    if (resource === "vans") {
      return { assignedTechnician: { userId: ctx.userId } };
    }
    if (resource === "chat-threads") {
      return { participants: { some: { userId: ctx.userId } } };
    }
    if (resource === "job-requests") {
      return {};
    }
  }

  return {};
}

export const GET = withApiErrorHandling(async (req, params) => {
  const resource = params?.resource;
  if (!resource) {
    return NextResponse.json({ error: "Resource is required" }, { status: 400 });
  }

  const config = getResourceConfig(resource);
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const ctx = await getApiContext(config.readRoles);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const model = (prisma as any)[config.model];
  const q = req.nextUrl.searchParams.get("q");
  const take = Math.min(Number(req.nextUrl.searchParams.get("take") || 100), 250);
  const skip = Number(req.nextUrl.searchParams.get("skip") || 0);

  const where: Record<string, unknown> = {
    ...getTenantWhere(ctx, req, config.tenantScoped),
    ...getRoleScope(resource, ctx),
  };

  if (q && config.searchFields && config.searchFields.length > 0) {
    where.OR = config.searchFields.map((field) => ({
      [field]: { contains: q, mode: "insensitive" },
    }));
  }

  const data = await model.findMany({
    where,
    orderBy: config.orderBy ?? { createdAt: "desc" },
    include: config.include,
    take,
    skip,
  });

  return NextResponse.json({ data });
});

export const POST = withApiErrorHandling(async (req, params) => {
  const resource = params?.resource;
  if (!resource) {
    return NextResponse.json({ error: "Resource is required" }, { status: 400 });
  }

  const config = getResourceConfig(resource);
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }

  const ctx = await getApiContext(config.writeRoles);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const body = (await req.json()) as Record<string, unknown>;
  const model = (prisma as any)[config.model];

  if (config.tenantScoped && !ctx.isSuperAdmin) {
    body.organisationId = ctx.organisationId;
  }
  if (config.tenantScoped && ctx.isSuperAdmin && !body.organisationId) {
    const orgIdFromQuery = req.nextUrl.searchParams.get("orgId");
    if (orgIdFromQuery) {
      body.organisationId = orgIdFromQuery;
    }
  }

  delete body.id;
  delete body.createdAt;
  delete body.updatedAt;

  const created = await model.create({ data: body });
  return NextResponse.json({ data: created }, { status: 201 });
});
