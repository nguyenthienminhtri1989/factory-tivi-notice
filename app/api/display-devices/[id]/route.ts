import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { cleanCode, cleanText } from "@/lib/admin-data";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const { id } = await context.params;
  const body = await request.json();
  const code = cleanCode(body.code);
  const name = cleanText(body.name);
  const displayGroupId = cleanText(body.displayGroupId);

  if (!displayGroupId || !code || !name) {
    return NextResponse.json({ error: "Cần chọn nhóm TV, nhập mã thiết bị và tên thiết bị." }, { status: 400 });
  }

  const displayDevice = await prisma.displayDevice.update({
    where: { id },
    data: {
      displayGroupId,
      code,
      name,
      location: cleanText(body.location) || null,
      isActive: Boolean(body.isActive ?? true)
    }
  });

  return NextResponse.json(displayDevice);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const { id } = await context.params;
  await prisma.displayDevice.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}