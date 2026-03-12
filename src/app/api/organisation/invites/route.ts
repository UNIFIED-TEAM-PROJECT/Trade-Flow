import crypto from "node:crypto";
import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(MembershipRole),
});

export async function GET() {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const data = await prisma.membershipInvite.findMany({
    where: { organisationId: ctx.organisationId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const input = schema.parse(await req.json());

  const token = crypto.randomBytes(24).toString("hex");
  const invite = await prisma.membershipInvite.create({
    data: {
      organisationId: ctx.organisationId!,
      email: input.email.toLowerCase(),
      role: input.role,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      createdById: ctx.userId,
    },
  });

  return NextResponse.json({
    data: invite,
    invitationLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/accept-invite?token=${token}`,
  });
}
