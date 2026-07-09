import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { resolveUploadPath } from "@/lib/upload-storage";

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
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
};

function contentType(filePath: string) {
  return mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const filePath = resolveUploadPath(params.path || []);

  if (!filePath) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    const file = await readFile(filePath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": contentType(filePath),
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }
}
