import { NextRequest, NextResponse } from "next/server";

const protectedPages = ["/admin", "/display"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProtectedPage = protectedPages.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!isProtectedPage) return NextResponse.next();

  const hasSession = Boolean(request.cookies.get("tivi_session")?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/display/:path*"]
};
