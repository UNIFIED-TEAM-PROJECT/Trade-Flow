import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const createSchema = z.object({
  subject: z.string().min(2),
  customerId: z.string().optional(),
  jobId: z.string().optional(),
  participantUserIds: z.array(z.string()).default([]),
});

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

  const threads = await prisma.chatThread.findMany({
    where: {
      organisationId: ctx.organisationId,
      ...(ctx.role === MembershipRole.CUSTOMER ? { customer: { userId: ctx.userId } } : {}),
      ...(ctx.role === MembershipRole.TECHNICIAN ? { participants: { some: { userId: ctx.userId } } } : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: { customer: true, job: true },
  });
  return NextResponse.json({ data: threads });
}

export async function POST(req: NextRequest) {
  const ctx = await getApiContext([
    MembershipRole.OWNER,
    MembershipRole.MANAGER,
    MembershipRole.TECHNICIAN,
    MembershipRole.CUSTOMER,
  ]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const input = createSchema.parse(await req.json());

  const thread = await prisma.chatThread.create({
    data: {
      organisationId: ctx.organisationId!,
      subject: input.subject,
      customerId: input.customerId,
      jobId: input.jobId,
      createdById: ctx.userId,
      participants: {
        create: [
          { userId: ctx.userId, role: ctx.role ?? MembershipRole.MANAGER },
          ...input.participantUserIds.map((userId) => ({
            userId,
            role: MembershipRole.TECHNICIAN,
          })),
        ],
      },
    },
  });

  return NextResponse.json({ data: thread }, { status: 201 });
}
