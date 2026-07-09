import type { AssetKind, AssetRole, Notice as DbNotice, NoticeAsset, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type NoticeType = "TEXT" | "IMAGE" | "MIXED" | "DOCUMENT";
export type NoticeLevel = "NORMAL" | "IMPORTANT" | "URGENT";
export type NoticeFitMode = "cover" | "contain";

export type Notice = {
  id: string;
  type: NoticeType;
  title: string;
  content: string;
  displayGroup: string;
  displayGroups: string[];
  displayDevices: string[];
  level: NoticeLevel;
  durationSeconds: number;
  isActive: boolean;
  sortOrder: number;
  backgroundColor: string;
  textColor: string;
  imageUrl: string;
  fitMode: NoticeFitMode;
  startAt: string | null;
  endAt: string | null;
  assets: NoticeAssetPayload[];
  createdAt: string;
  updatedAt: string;
};

export type NoticeAssetPayload = {
  id: string;
  kind: AssetKind;
  role: AssetRole;
  fileName: string;
  originalName: string | null;
  mimeType: string;
  fileSize: number | null;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
  createdAt: string;
};

export type NoticeStore = {
  updatedAt: string;
  notices: Notice[];
};

export type NoticeAssetInput = Partial<Omit<NoticeAssetPayload, "id" | "createdAt">> & {
  url: string;
};

export type NoticeInput = Partial<{
  type: NoticeType;
  title: string;
  content: string;
  displayGroup: string;
  displayGroups: string[];
  displayDevices: string[];
  level: NoticeLevel;
  durationSeconds: number;
  isActive: boolean;
  sortOrder: number;
  backgroundColor: string;
  textColor: string;
  imageUrl: string;
  fitMode: NoticeFitMode;
  startAt: string | null;
  endAt: string | null;
  assets: NoticeAssetInput[];
}>;

const noticeInclude = {
  targets: {
    include: {
      displayGroup: {
        select: { code: true }
      }
    }
  },
  deviceTargets: {
    include: {
      displayDevice: {
        select: { code: true, displayGroup: { select: { code: true } } }
      }
    }
  },
  assets: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  }
} satisfies Prisma.NoticeInclude;

type NoticeWithRelations = Prisma.NoticeGetPayload<{ include: typeof noticeInclude }>;

const defaultFactory = {
  code: "default",
  name: "Nhà máy mặc định"
};

export async function readNoticeStore(): Promise<NoticeStore> {
  const notices = await prisma.notice.findMany({
    include: includeNoticeRelations(),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  const updatedAt = notices.reduce<string | null>((latest, notice) => {
    const value = notice.updatedAt.toISOString();
    return !latest || value > latest ? value : latest;
  }, null);

  return {
    updatedAt: updatedAt || new Date().toISOString(),
    notices: notices.map(mapNotice)
  };
}

export async function getDisplayNotices(groupCode: string, deviceCode?: string): Promise<NoticeStore> {
  const now = new Date();
  const notices = await prisma.notice.findMany({
    where: {
      isActive: true,
      OR: [
        {
          targets: {
            some: {
              displayGroup: {
                code: groupCode,
                isActive: true
              }
            }
          }
        },
        ...(deviceCode ? [{
          deviceTargets: {
            some: {
              displayDevice: {
                code: deviceCode,
                isActive: true,
                displayGroup: {
                  code: groupCode,
                  isActive: true
                }
              }
            }
          }
        }] : [])
      ],
      AND: [
        { OR: [{ startAt: null }, { startAt: { lte: now } }] },
        { OR: [{ endAt: null }, { endAt: { gte: now } }] }
      ]
    },
    include: includeNoticeRelations(),
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });

  return {
    updatedAt: notices[0]?.updatedAt.toISOString() || new Date().toISOString(),
    notices: notices.map(mapNotice)
  };
}

export async function createNotice(input: NoticeInput): Promise<Notice> {
  const normalized = normalizeNotice(input);
  const targetDeviceCodes = normalizeDisplayDeviceCodes(input.displayDevices ?? normalized.displayDevices);
  const targetCodes = normalizeDisplayGroupCodes(input.displayGroups ?? input.displayGroup ?? normalized.displayGroups, targetDeviceCodes.length === 0);
  const displayGroups = await ensureDisplayGroups(targetCodes);
  const displayDevices = await findDisplayDevices(targetDeviceCodes);

  const notice = await prisma.notice.create({
    data: {
      type: normalized.type,
      title: normalized.title,
      content: normalized.content,
      level: normalized.level,
      durationSeconds: normalized.durationSeconds,
      isActive: normalized.isActive,
      sortOrder: normalized.sortOrder,
      backgroundColor: normalized.backgroundColor,
      textColor: normalized.textColor,
      imageUrl: normalized.imageUrl,
      fitMode: normalized.fitMode,
      startAt: normalized.startAt ? new Date(normalized.startAt) : null,
      endAt: normalized.endAt ? new Date(normalized.endAt) : null,
      targets: {
        create: displayGroups.map((displayGroup) => ({ displayGroupId: displayGroup.id }))
      },
      deviceTargets: {
        create: displayDevices.map((displayDevice) => ({ displayDeviceId: displayDevice.id }))
      },
      assets: {
        create: normalized.assets.map((asset, index) => assetCreateData(asset, index))
      }
    },
    include: includeNoticeRelations()
  });

  await writeAuditLog(notice.id, "CREATE", notice);
  return mapNotice(notice);
}

export async function updateNotice(id: string, input: NoticeInput): Promise<Notice | null> {
  const existing = await prisma.notice.findUnique({
    where: { id },
    include: includeNoticeRelations()
  });

  if (!existing) return null;

  const normalized = normalizeNotice(input, mapNotice(existing));
  const targetDeviceCodes = normalizeDisplayDeviceCodes(input.displayDevices ?? normalized.displayDevices);
  const targetCodes = normalizeDisplayGroupCodes(input.displayGroups ?? input.displayGroup ?? normalized.displayGroups, targetDeviceCodes.length === 0);
  const displayGroups = await ensureDisplayGroups(targetCodes);
  const displayDevices = await findDisplayDevices(targetDeviceCodes);

  const notice = await prisma.$transaction(async (tx) => {
    await tx.noticeTarget.deleteMany({ where: { noticeId: id } });
    await tx.noticeDeviceTarget.deleteMany({ where: { noticeId: id } });
    await tx.noticeAsset.deleteMany({ where: { noticeId: id } });

    return tx.notice.update({
      where: { id },
      data: {
        type: normalized.type,
        title: normalized.title,
        content: normalized.content,
        level: normalized.level,
        durationSeconds: normalized.durationSeconds,
        isActive: normalized.isActive,
        sortOrder: normalized.sortOrder,
        backgroundColor: normalized.backgroundColor,
        textColor: normalized.textColor,
        imageUrl: normalized.imageUrl,
        fitMode: normalized.fitMode,
        startAt: normalized.startAt ? new Date(normalized.startAt) : null,
        endAt: normalized.endAt ? new Date(normalized.endAt) : null,
        targets: {
          create: displayGroups.map((displayGroup) => ({ displayGroupId: displayGroup.id }))
        },
        deviceTargets: {
          create: displayDevices.map((displayDevice) => ({ displayDeviceId: displayDevice.id }))
        },
        assets: {
          create: normalized.assets.map((asset, index) => assetCreateData(asset, index))
        }
      },
      include: includeNoticeRelations()
    });
  });

  await writeAuditLog(notice.id, notice.isActive ? "UPDATE" : "DEACTIVATE", notice);
  return mapNotice(notice);
}

export async function deleteNotice(id: string): Promise<boolean> {
  const existing = await prisma.notice.findUnique({ where: { id } });
  if (!existing) return false;

  await prisma.notice.delete({ where: { id } });
  await writeAuditLog(id, "DELETE", existing);
  return true;
}

export function normalizeNotice(input: NoticeInput, existing?: Notice): Notice {
  const now = new Date().toISOString();
  const durationSeconds = Number(input.durationSeconds ?? existing?.durationSeconds ?? 30);
  const sortOrder = Number(input.sortOrder ?? existing?.sortOrder ?? 0);
  const targetDeviceCodes = normalizeDisplayDeviceCodes(input.displayDevices ?? existing?.displayDevices ?? []);
  const groupSource = input.displayGroups ?? input.displayGroup ?? existing?.displayGroups ?? existing?.displayGroup ?? (targetDeviceCodes.length === 0 ? "xuong-a" : "");
  const targetCodes = normalizeDisplayGroupCodes(groupSource, targetDeviceCodes.length === 0);

  return {
    id: existing?.id || "",
    type: isNoticeType(input.type) ? input.type : existing?.type || "TEXT",
    title: String(input.title ?? existing?.title ?? "").trim(),
    content: String(input.content ?? existing?.content ?? "").trim(),
    displayGroup: targetCodes[0] || "",
    displayGroups: targetCodes,
    displayDevices: targetDeviceCodes,
    level: isNoticeLevel(input.level) ? input.level : existing?.level || "NORMAL",
    durationSeconds: Number.isFinite(durationSeconds) ? Math.min(Math.max(durationSeconds, 5), 600) : 30,
    isActive: Boolean(input.isActive ?? existing?.isActive ?? true),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    backgroundColor: String(input.backgroundColor ?? existing?.backgroundColor ?? "#111827"),
    textColor: String(input.textColor ?? existing?.textColor ?? "#f9fafb"),
    imageUrl: String(input.imageUrl ?? existing?.imageUrl ?? "").trim(),
    fitMode: input.fitMode === "contain" || input.fitMode === "cover" ? input.fitMode : existing?.fitMode || "cover",
    startAt: normalizeOptionalDate(input.startAt ?? existing?.startAt ?? null),
    endAt: normalizeOptionalDate(input.endAt ?? existing?.endAt ?? null),
    assets: normalizeNoticeAssets(input.assets ?? existing?.assets ?? []),
    createdAt: existing?.createdAt || now,
    updatedAt: now
  };
}

export function validateNotice(notice: Notice): string | null {
  if (!notice.title && !notice.content && !notice.imageUrl && notice.assets.length === 0) {
    return "Cần nhập tiêu đề, nội dung, đường dẫn ảnh hoặc tệp đính kèm.";
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(notice.backgroundColor)) {
    return "Màu nền phải đúng định dạng #RRGGBB.";
  }

  if (!/^#[0-9a-fA-F]{6}$/.test(notice.textColor)) {
    return "Màu chữ phải đúng định dạng #RRGGBB.";
  }

  if (notice.startAt && notice.endAt && new Date(notice.startAt) > new Date(notice.endAt)) {
    return "Thời gian bắt đầu không được sau thời gian kết thúc.";
  }

  return null;
}

export function sortNotices(notices: Notice[]) {
  return [...notices].sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));
}

export function normalizeDisplayGroupCodes(value: string | string[] | undefined | null, useDefault = true): string[] {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  const codes = values
    .map((item) => String(item).trim())
    .filter(Boolean);

  return Array.from(new Set(codes.length ? codes : useDefault ? ["xuong-a"] : []));
}

export function normalizeDisplayDeviceCodes(value: string | string[] | undefined | null): string[] {
  const values = Array.isArray(value) ? value : String(value || "").split(",");
  const codes = values
    .map((item) => String(item).trim())
    .filter(Boolean);

  return Array.from(new Set(codes));
}
function includeNoticeRelations() {
  return noticeInclude;
}

async function ensureDisplayGroups(codes: string[]) {
  const factory = await prisma.factory.upsert({
    where: { code: defaultFactory.code },
    update: {},
    create: defaultFactory
  });

  return Promise.all(
    codes.map((code) =>
      prisma.displayGroup.upsert({
        where: { code },
        update: {},
        create: {
          code,
          name: code,
          factoryId: factory.id
        }
      })
    )
  );
}

async function findDisplayDevices(codes: string[]) {
  if (codes.length === 0) return [];

  return prisma.displayDevice.findMany({
    where: {
      code: { in: codes },
      isActive: true,
      displayGroup: { isActive: true }
    }
  });
}
async function writeAuditLog(noticeId: string, action: "CREATE" | "UPDATE" | "DELETE" | "ACTIVATE" | "DEACTIVATE", snapshot: unknown) {
  await prisma.noticeAuditLog.create({
    data: {
      noticeId,
      action,
      snapshot: snapshot === undefined ? undefined : JSON.parse(JSON.stringify(snapshot))
    }
  });
}

function mapNotice(notice: NoticeWithRelations): Notice {
  const displayGroups = notice.targets.map((target) => target.displayGroup.code);
  const displayDevices = notice.deviceTargets.map((target) => target.displayDevice.code);
  return {
    id: notice.id,
    type: notice.type,
    title: notice.title,
    content: notice.content,
    displayGroup: displayGroups[0] || "",
    displayGroups,
    displayDevices,
    level: notice.level,
    durationSeconds: notice.durationSeconds,
    isActive: notice.isActive,
    sortOrder: notice.sortOrder,
    backgroundColor: notice.backgroundColor,
    textColor: notice.textColor,
    imageUrl: notice.imageUrl,
    fitMode: notice.fitMode,
    startAt: notice.startAt?.toISOString() || null,
    endAt: notice.endAt?.toISOString() || null,
    assets: notice.assets.map(mapAsset),
    createdAt: notice.createdAt.toISOString(),
    updatedAt: notice.updatedAt.toISOString()
  };
}

function assetCreateData(asset: NoticeAssetPayload, index: number) {
  return {
    kind: asset.kind,
    role: asset.role,
    fileName: asset.fileName,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    url: asset.url,
    thumbnailUrl: asset.thumbnailUrl,
    width: asset.width,
    height: asset.height,
    sortOrder: asset.sortOrder ?? index
  };
}

function normalizeNoticeAssets(assets: NoticeAssetInput[] | NoticeAssetPayload[]): NoticeAssetPayload[] {
  const normalized: NoticeAssetPayload[] = [];

  assets.forEach((asset, index) => {
    const url = String(asset.url || "").trim();
    if (!url) return;

    const fileName = String(asset.fileName || url.split("/").pop() || "tep-thong-bao");
    const mimeType = String(asset.mimeType || "");
    const kind = isAssetKind(asset.kind) ? asset.kind : mimeType.startsWith("image/") ? "IMAGE" : "DOCUMENT";
    const role = isAssetRole(asset.role) ? asset.role : index === 0 ? "PRIMARY" : "ATTACHMENT";

    normalized.push({
      id: "id" in asset && asset.id ? String(asset.id) : "",
      kind,
      role,
      fileName,
      originalName: asset.originalName ?? fileName,
      mimeType: mimeType || "application/octet-stream",
      fileSize: typeof asset.fileSize === "number" ? asset.fileSize : null,
      url,
      thumbnailUrl: asset.thumbnailUrl ?? null,
      width: typeof asset.width === "number" ? asset.width : null,
      height: typeof asset.height === "number" ? asset.height : null,
      sortOrder: typeof asset.sortOrder === "number" ? asset.sortOrder : index,
      createdAt: "createdAt" in asset && asset.createdAt ? String(asset.createdAt) : new Date().toISOString()
    });
  });

  return normalized;
}
function isAssetKind(value: unknown): value is AssetKind {
  return value === "IMAGE" || value === "DOCUMENT" || value === "VIDEO" || value === "OTHER";
}

function isAssetRole(value: unknown): value is AssetRole {
  return value === "PRIMARY" || value === "ATTACHMENT" || value === "THUMBNAIL";
}

function mapAsset(asset: NoticeAsset): NoticeAssetPayload {
  return {
    id: asset.id,
    kind: asset.kind,
    role: asset.role,
    fileName: asset.fileName,
    originalName: asset.originalName,
    mimeType: asset.mimeType,
    fileSize: asset.fileSize,
    url: asset.url,
    thumbnailUrl: asset.thumbnailUrl,
    width: asset.width,
    height: asset.height,
    sortOrder: asset.sortOrder,
    createdAt: asset.createdAt.toISOString()
  };
}

function normalizeOptionalDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isNoticeType(value: unknown): value is NoticeType {
  return value === "TEXT" || value === "IMAGE" || value === "MIXED" || value === "DOCUMENT";
}

function isNoticeLevel(value: unknown): value is NoticeLevel {
  return value === "NORMAL" || value === "IMPORTANT" || value === "URGENT";
}



