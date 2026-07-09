import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { cleanCode, cleanText, listFactories } from "@/lib/admin-data";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  return NextResponse.json({ factories: await listFactories() });
}

export async function POST(request: Request) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const body = await request.json();
  const code = cleanCode(body.code);
  const name = cleanText(body.name);

  if (!code || !name) {
    return NextResponse.json({ error: "Cần nhập mã và tên xưởng." }, { status: 400 });
  }

  const factory = await prisma.factory.create({
    data: {
      code,
      name,
      description: cleanText(body.description) || null,
      isActive: Boolean(body.isActive ?? true)
    }
  });

  return NextResponse.json(factory, { status: 201 });
}