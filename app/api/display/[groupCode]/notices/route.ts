import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { getDisplayNotices } from "@/lib/notices";

type RouteContext = {
  params: Promise<{
    groupCode: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const authError = await requireApiRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (authError) return authError;
  const { groupCode } = await context.params;
  const { searchParams } = new URL(request.url);
  const deviceCode = searchParams.get("device") || "";
  const store = await getDisplayNotices(groupCode, deviceCode || undefined);

  return NextResponse.json({
    groupCode,
    deviceCode,
    updatedAt: store.updatedAt,
    serverTime: new Date().toISOString(),
    notices: store.notices
  });
}
