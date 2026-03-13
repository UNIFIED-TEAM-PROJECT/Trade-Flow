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
    if (resource === "jobs" || resource === "properties" || resource === "estimates" || resource === "invoices") {
      return { customer: { userId: ctx.userId } };
    }
    if (resource === "job-requests") {
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
    if (resource === "subscriptions") {
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
  const id = params?.id;
  if (!resource || !id) {
    return NextResponse.json({ error: "Resource and id required" }, { status: 400 });
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
  const where = {
    id,
    ...getTenantWhere(ctx, req, config.tenantScoped),
    ...getRoleScope(resource, ctx),
  };

  const data = await model.findFirst({ where, include: config.include });
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ data });
});

export const PATCH = withApiErrorHandling(async (req, params) => {
  const resource = params?.resource;
  const id = params?.id;
  if (!resource || !id) {
    return NextResponse.json({ error: "Resource and id required" }, { status: 400 });
  }

  const config = getResourceConfig(resource);
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
  const ctx = await getApiContext(config.writeRoles);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const model = (prisma as any)[config.model];
  const body = (await req.json()) as Record<string, unknown>;
  delete body.id;
  delete body.organisationId;
  delete body.createdAt;
  delete body.updatedAt;

  const exists = await model.findFirst({
    where: {
      id,
      ...getTenantWhere(ctx, req, config.tenantScoped),
      ...getRoleScope(resource, ctx),
    },
  });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await model.update({
    where: { id },
    data: body,
  });

  return NextResponse.json({ data });
});

export const DELETE = withApiErrorHandling(async (req, params) => {
  const resource = params?.resource;
  const id = params?.id;
  if (!resource || !id) {
    return NextResponse.json({ error: "Resource and id required" }, { status: 400 });
  }

  const config = getResourceConfig(resource);
  if (!config) {
    return NextResponse.json({ error: "Unknown resource" }, { status: 404 });
  }
  const ctx = await getApiContext(config.writeRoles);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const model = (prisma as any)[config.model];
  const exists = await model.findFirst({
    where: {
      id,
      ...getTenantWhere(ctx, req, config.tenantScoped),
      ...getRoleScope(resource, ctx),
    },
  });
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await model.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});
