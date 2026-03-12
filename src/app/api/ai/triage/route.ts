import { MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { runAiTriage } from "@/lib/ai";
import { prisma } from "@/lib/db";

const schema = z.object({
  text: z.string().min(10),
  jobId: z.string().optional(),
  isSubscriber: z.boolean().optional(),
});

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

  const input = schema.parse(await req.json());
  const output = runAiTriage(input);

  if (ctx.organisationId) {
    await prisma.aiInteraction.create({
      data: {
        organisationId: ctx.organisationId,
        userId: ctx.userId,
        jobId: input.jobId,
        workflow: "triage",
        inputText: input.text,
        outputText: JSON.stringify(output),
      },
    });
  }

  return NextResponse.json({ data: output });
}
