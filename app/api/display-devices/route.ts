import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { cleanCode, cleanText, listDisplayDevices } from "@/lib/admin-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  return NextResponse.json({ displayDevices: await listDisplayDevices() });
}

export async function POST(request: Request) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const body = await request.json();
  const code = cleanCode(body.code);
  const name = cleanText(body.name);
  const displayGroupId = cleanText(body.displayGroupId);

  if (!displayGroupId || !code || !name) {
    return NextResponse.json({ error: "Cần chọn nhóm TV, nhập mã thiết bị và tên thiết bị." }, { status: 400 });
  }

  const displayDevice = await prisma.displayDevice.create({
    data: {
      displayGroupId,
      code,
      name,
      location: cleanText(body.location) || null,
      isActive: Boolean(body.isActive ?? true)
    }
  });

  return NextResponse.json(displayDevice, { status: 201 });
}