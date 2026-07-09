import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { cleanCode, cleanText, listDisplayGroups } from "@/lib/admin-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  return NextResponse.json({ displayGroups: await listDisplayGroups() });
}

export async function POST(request: Request) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const body = await request.json();
  const code = cleanCode(body.code);
  const name = cleanText(body.name);
  const factoryId = cleanText(body.factoryId);

  if (!factoryId || !code || !name) {
    return NextResponse.json({ error: "Cần chọn xưởng, nhập mã nhóm và tên nhóm TV." }, { status: 400 });
  }

  const displayGroup = await prisma.displayGroup.create({
    data: {
      factoryId,
      code,
      name,
      description: cleanText(body.description) || null,
      isActive: Boolean(body.isActive ?? true)
    }
  });

  return NextResponse.json(displayGroup, { status: 201 });
}