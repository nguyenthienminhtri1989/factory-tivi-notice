import { NextResponse } from "next/server";
import { hashPassword, setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!username || !password) {
    return NextResponse.json({ error: "Cần nhập tên đăng nhập và mật khẩu." }, { status: 400 });
  }

  const userCount = await prisma.user.count();

  if (userCount === 0) {
    const admin = await prisma.user.create({
      data: {
        username,
        passwordHash: hashPassword(password),
        fullName: "Quản trị hệ thống",
        role: "ADMIN",
        isActive: true
      },
      select: { id: true, username: true, fullName: true, role: true }
    });
    await setSessionCookie(admin);
    return NextResponse.json({ user: admin, firstAdminCreated: true });
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, fullName: true, role: true, passwordHash: true, isActive: true }
  });

  if (!user?.isActive || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Tên đăng nhập hoặc mật khẩu không đúng." }, { status: 401 });
  }

  const authUser = { id: user.id, username: user.username, fullName: user.fullName, role: user.role };
  await setSessionCookie(authUser);
  return NextResponse.json({ user: authUser });
}
