import { MembershipRole, PlatformRole, Prisma } from "@prisma/client";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "./auth";
import { prisma } from "./db";

export type ApiContext = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  platformRole: PlatformRole;
  role?: MembershipRole;
  organisationId?: string;
  isSuperAdmin: boolean;
};

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getApiContext(requiredRoles: MembershipRole[] = []): Promise<ApiContext | NextResponse> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) {
    return jsonError("Unauthenticated", 401);
  }

  const session = verifySession(token);
  if (!session) {
    return jsonError("Invalid session", 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { memberships: true },
  });

  if (!user || !user.isActive) {
    return jsonError("User not found", 401);
  }

  let membership = null;
  if (session.organisationId) {
    membership = user.memberships.find((item) => item.organisationId === session.organisationId) ?? null;
  }
  if (!membership) {
    membership = user.memberships.find((item) => item.isPrimary) ?? user.memberships[0] ?? null;
  }

  const isSuperAdmin = user.platformRole === PlatformRole.SUPER_ADMIN;
  if (!membership && !isSuperAdmin) {
    return jsonError("No organisation membership", 403);
  }

  const role = membership?.role;
  if (requiredRoles.length > 0 && !isSuperAdmin && (!role || !requiredRoles.includes(role))) {
    return jsonError("Forbidden", 403);
  }

  return {
    userId: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    platformRole: user.platformRole,
    role,
    organisationId: membership?.organisationId,
    isSuperAdmin,
  };
}

export function getTenantWhere(ctx: ApiContext, req: NextRequest, tenantScoped = true) {
  if (!tenantScoped) {
    return {};
  }
  if (!ctx.isSuperAdmin) {
    return { organisationId: ctx.organisationId };
  }
  const orgId = req.nextUrl.searchParams.get("orgId");
  return orgId ? { organisationId: orgId } : {};
}

export function withApiErrorHandling(fn: (req: NextRequest, params?: Record<string, string>) => Promise<NextResponse>) {
  return async (req: NextRequest, context: { params: Record<string, string> }) => {
    try {
      return await fn(req, context?.params);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return jsonError(error.message, 400);
      }
      console.error(error);
      return jsonError("Unexpected server error", 500);
    }
  };
}
