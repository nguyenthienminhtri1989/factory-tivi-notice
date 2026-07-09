import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/api-auth";
import { deleteNotice, normalizeNotice, readNoticeStore, updateNotice, validateNotice } from "@/lib/notices";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const { id } = await context.params;
  const store = await readNoticeStore();
  const existing = store.notices.find((notice) => notice.id === id);

  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  }

  const body = await request.json();
  const normalized = normalizeNotice(body, existing);
  const validationError = validateNotice(normalized);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const notice = await updateNotice(id, body);
  if (!notice) {
    return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  }

  return NextResponse.json(notice);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authError = await requireApiRole(["ADMIN", "EDITOR"]);
  if (authError) return authError;
  const { id } = await context.params;
  const ok = await deleteNotice(id);

  if (!ok) {
    return NextResponse.json({ error: "Không tìm thấy thông báo." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}