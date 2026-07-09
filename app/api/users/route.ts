import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireApiRole } from "@/lib/api-auth";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function cleanUsername(value: unknown) {
  return cleanText(value).toLowerCase();
}

function cleanRole(value: unknown): UserRole {
  return value === "ADMIN" || value === "VIEWER" || value === "EDITOR" ? value : "EDITOR";
}

export async function GET() {
  const authError = await requireApiRole(["ADMIN"]);
  if (authError) return authError;

  const users = await prisma.user.findMany({
    select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true },
    orderBy: [{ role: "asc" }, { username: "asc" }]
  });

  return NextResponse.json({
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    }))
  });
}

export async function POST(request: Request) {
  const authError = await requireApiRole(["ADMIN"]);
  if (authError) return authError;

  const body = await request.json();
  const username = cleanUsername(body.username);
  const fullName = cleanText(body.fullName);
  const password = String(body.password || "");
  const role = cleanRole(body.role);

  if (!username || !fullName || password.length < 6) {
    return NextResponse.json({ error: "Cần nhập tên đăng nhập, họ tên và mật khẩu tối thiểu 6 ký tự." }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      username,
      fullName,
      passwordHash: hashPassword(password),
      role,
      isActive: Boolean(body.isActive ?? true)
    },
    select: { id: true, username: true, fullName: true, role: true, isActive: true, createdAt: true, updatedAt: true }
  });

  return NextResponse.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  }, { status: 201 });
}
