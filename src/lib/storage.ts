import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const ROOT_UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function ensureUploadDir(dir: string) {
  const target = path.join(ROOT_UPLOAD_DIR, dir);
  await fs.mkdir(target, { recursive: true });
  return target;
}

export async function saveFile(file: File, folder = "misc") {
  const dir = await ensureUploadDir(folder);
  const ext = path.extname(file.name) || "";
  const safeName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const filePath = path.join(dir, safeName);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  return {
    fileName: file.name,
    filePath: `/uploads/${folder}/${safeName}`,
    sizeBytes: file.size,
    mimeType: file.type,
  };
}
