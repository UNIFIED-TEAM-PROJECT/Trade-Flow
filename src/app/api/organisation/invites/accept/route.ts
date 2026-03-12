import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  token: z.string().min(16),
});

export async function POST(req: NextRequest) {
  const ctx = await getApiContext();
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const { token } = schema.parse(await req.json());
  const invite = await prisma.membershipInvite.findUnique({ where: { token } });
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite is invalid or expired." }, { status: 400 });
  }
  if (invite.email.toLowerCase() !== ctx.email.toLowerCase()) {
    return NextResponse.json({ error: "Invite email does not match current user." }, { status: 403 });
  }

  const data = await prisma.$transaction(async (tx) => {
    const membership = await tx.membership.create({
      data: {
        organisationId: invite.organisationId,
        userId: ctx.userId,
        role: invite.role,
        isPrimary: false,
      },
    });
    await tx.membershipInvite.update({
      where: { id: invite.id },
      data: {
        acceptedAt: new Date(),
        inviteeUserId: ctx.userId,
      },
    });
    return membership;
  });

  return NextResponse.json({ data });
}
