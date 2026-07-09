import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { getUploadRoot, uploadPublicUrl } from "@/lib/upload-storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 30 * 1024 * 1024;
const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx"
]);

function removeVietnameseMarks(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0111/g, "d")
    .replace(/\u0110/g, "D");
}

function safeFileName(name: string) {
  const extension = path.extname(name).toLowerCase();
  const baseName = path.basename(name, extension);
  const normalized = removeVietnameseMarks(baseName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${normalized || "tep-thong-bao"}-${randomUUID()}${extension}`;
}

function assetKind(mimeType: string, extension: string) {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if ([".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"].includes(extension)) return "DOCUMENT";
  return "OTHER";
}

export async function POST(request: Request) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "C\u1ea7n ch\u1ecdn t\u1ec7p \u0111\u1ec3 t\u1ea3i l\u00ean." }, { status: 400 });
  }

  if (file.size <= 0) {
    return NextResponse.json({ error: "T\u1ec7p t\u1ea3i l\u00ean \u0111ang r\u1ed7ng." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Dung l\u01b0\u1ee3ng t\u1ec7p t\u1ed1i \u0111a l\u00e0 30 MB." }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase();
  if (!allowedExtensions.has(extension)) {
    return NextResponse.json({ error: "Ch\u1ec9 h\u1ed7 tr\u1ee3 \u1ea3nh, PDF, Word, Excel v\u00e0 PowerPoint." }, { status: 400 });
  }

  const now = new Date();
  const folder = path.join(
    getUploadRoot(),
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, "0")
  );
  await mkdir(folder, { recursive: true });

  const fileName = safeFileName(file.name);
  const filePath = path.join(folder, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const publicUrl = uploadPublicUrl([String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, "0"), fileName]);

  return NextResponse.json({
    asset: {
      kind: assetKind(file.type, extension),
      role: "PRIMARY",
      fileName,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      url: publicUrl,
      thumbnailUrl: null,
      width: null,
      height: null,
      sortOrder: 0
    }
  });
}
