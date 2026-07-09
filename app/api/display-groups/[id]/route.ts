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
  const factoryId = cleanText(body.factoryId);

  if (!factoryId || !code || !name) {
    return NextResponse.json({ error: "Cần chọn xưởng, nhập mã nhóm và tên nhóm TV." }, { status: 400 });
  }

  const displayGroup = await prisma.displayGroup.update({
    where: { id },
    data: {
      factoryId,
      code,
      name,
      description: cleanText(body.description) || null,
      isActive: Boolean(body.isActive ?? true)
    }
  });

  return NextResponse.json(displayGroup);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const { id } = await context.params;
  await prisma.displayGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}