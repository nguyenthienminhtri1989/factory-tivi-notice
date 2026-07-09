import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";

export async function requireApiRole(roles: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
  }

  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: "Tài khoản không có quyền thực hiện thao tác này." }, { status: 403 });
  }

  return null;
}
