import { MembershipRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { getAccountingOverview } from "@/lib/accounting";

export async function GET() {
  const ctx = await getApiContext([MembershipRole.OWNER, MembershipRole.MANAGER]);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected" }, { status: 400 });
  }

  const data = await getAccountingOverview(ctx.organisationId);
  return NextResponse.json({ data });
}
