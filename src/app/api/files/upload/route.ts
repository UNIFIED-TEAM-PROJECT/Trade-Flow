import { AttachmentEntityType, MembershipRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getApiContext } from "@/lib/api";
import { prisma } from "@/lib/db";
import { saveFile } from "@/lib/storage";

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
  if (!ctx.organisationId) {
    return NextResponse.json({ error: "No organisation selected" }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const entityTypeRaw = String(form.get("entityType") || "OTHER");
  const entityId = String(form.get("entityId") || "unscoped");
  const folder = String(form.get("folder") || "misc");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file supplied" }, { status: 400 });
  }

  const entityType = Object.values(AttachmentEntityType).includes(entityTypeRaw as AttachmentEntityType)
    ? (entityTypeRaw as AttachmentEntityType)
    : AttachmentEntityType.OTHER;

  const saved = await saveFile(file, folder);
  const attachment = await prisma.attachment.create({
    data: {
      organisationId: ctx.organisationId,
      uploadedById: ctx.userId,
      entityType,
      entityId,
      fileName: saved.fileName,
      filePath: saved.filePath,
      mimeType: saved.mimeType,
      sizeBytes: saved.sizeBytes,
    },
  });

  return NextResponse.json({ data: attachment }, { status: 201 });
}
