import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  body: z.string().min(1),
});

export async function GET(_req: NextRequest, { params }: { params: { threadId: string } }) {
  const ctx = await getApiContext([
    MembershipRole.OWNER,
    MembershipRole.MANAGER,
    MembershipRole.TECHNICIAN,
    MembershipRole.CUSTOMER,
  ]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const thread = await prisma.chatThread.findFirst({
    where: {
      id: params.threadId,
      organisationId: ctx.organisationId,
      ...(ctx.role === MembershipRole.CUSTOMER ? { customer: { userId: ctx.userId } } : {}),
      ...(ctx.role === MembershipRole.TECHNICIAN
        ? {
            OR: [
              { participants: { some: { userId: ctx.userId } } },
              { job: { technician: { userId: ctx.userId } } },
            ],
          }
        : {}),
    },
  });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return NextResponse.json({ data: messages });
}

export async function POST(req: NextRequest, { params }: { params: { threadId: string } }) {
  const ctx = await getApiContext([
    MembershipRole.OWNER,
    MembershipRole.MANAGER,
    MembershipRole.TECHNICIAN,
    MembershipRole.CUSTOMER,
  ]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const input = schema.parse(await req.json());
  const thread = await prisma.chatThread.findFirst({
    where: {
      id: params.threadId,
      organisationId: ctx.organisationId,
      ...(ctx.role === MembershipRole.CUSTOMER ? { customer: { userId: ctx.userId } } : {}),
    },
  });
  if (!thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  const message = await prisma.chatMessage.create({
    data: {
      organisationId: ctx.organisationId!,
      threadId: thread.id,
      senderId: ctx.userId,
      body: input.body,
    },
  });

  await prisma.chatThread.update({
    where: { id: thread.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ data: message }, { status: 201 });
}
