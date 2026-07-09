import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { legacyPublicUploadPath, resolveUploadPath } from "@/lib/upload-storage";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const mimeTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf"
};

function contentType(filePath: string) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

async function existingFile(paths: Array<string | null>) {
  for (const filePath of paths) {
    if (!filePath) continue;
    try {
      const info = await stat(filePath);
      if (info.isFile()) return { filePath, info };
    } catch {}
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const parts = params.path || [];
  const found = await existingFile([resolveUploadPath(parts), legacyPublicUploadPath(parts)]);

  if (!found) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  const file = await readFile(found.filePath);
  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType(found.filePath),
      "Content-Length": String(found.info.size),
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
