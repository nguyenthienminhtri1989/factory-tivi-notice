import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { createNotice, normalizeNotice, readNoticeStore, validateNotice } from "@/lib/notices";

export async function GET() {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const store = await readNoticeStore();
  return NextResponse.json(store);
}

export async function POST(request: Request) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const body = await request.json();
  const normalized = normalizeNotice(body);
  const validationError = validateNotice(normalized);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const notice = await createNotice(body);
  return NextResponse.json(notice, { status: 201 });
}