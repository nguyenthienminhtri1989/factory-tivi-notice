import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireApiRole } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanUsername(value: unknown) {
  return cleanText(value).toLowerCase();
}

function cleanRole(value: unknown): UserRole {
  return value === "ADMIN" || value === "VIEWER" || value === "EDITOR" ? value : "EDITOR";
}

export async function PUT(request: Request, context: RouteContext) {
  const authError = await requireApiRole(["ADMIN"]);
  if (authError) return authError;

  const { id } = await context.params;
  const body = await request.json();
  const username = cleanUsername(body.username);
  const fullName = cleanText(body.fullName);
  const password = String(body.password || "");
  const role = cleanRole(body.role);

  if (!username || !fullName) {
    return NextResponse.json({ error: "Cần nhập tên đăng nhập và họ tên." }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      username,
      fullName,
      role,
      isActive: Boolean(body.isActive ?? true),
      ...(password ? { passwordHash: hashPassword(password) } : {})
    },
    select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true }
  });

  return NextResponse.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiRole(["ADMIN"]);
  if (authError) return authError;

  const { id } = await context.params;
  await prisma.user.update({ where: { id }, data: { isActive: false } });
  return NextResponse.json({ ok: true });
}
