import { InvoiceStatus, MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";

const schema = z.object({
  amount: z.number().positive().optional(),
  method: z.string().default("BANK_TRANSFER"),
  reference: z.string().optional(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER, MembershipRole.CUSTOMER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }

  const input = schema.parse(await req.json());
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: params.id,
      organisationId: ctx.organisationId,
      ...(ctx.role === MembershipRole.CUSTOMER ? { customer: { userId: ctx.userId } } : {}),
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const amount = input.amount ?? Number(invoice.total);

  const data = await prisma.$transaction(async (tx) => {
    await tx.mockPayment.create({
      data: {
        invoiceId: invoice.id,
        amount,
        method: input.method,
        reference: input.reference,
        status: "SUCCESS",
      },
    });

    const nextStatus = amount >= Number(invoice.total) ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
    const updated = await tx.invoice.update({
      where: { id: invoice.id },
      data: {
        status: nextStatus,
        paidAt: nextStatus === InvoiceStatus.PAID ? new Date() : invoice.paidAt,
      },
    });

    if (nextStatus === InvoiceStatus.PAID && invoice.jobId) {
      await tx.job.update({
        where: { id: invoice.jobId },
        data: { status: "PAID" },
      });
    }

    return updated;
  });

  return NextResponse.json({ data });
}
