const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const ROOT_DIR = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DATA_FILE = path.join(ROOT_DIR, "data", "notices.json");
const PORT = Number(process.env.PORT || 3003);

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function readStore() {
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return JSON.parse(raw);
}

async function writeStore(store) {
  store.updatedAt = new Date().toISOString();
  await fs.writeFile(DATA_FILE, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
    if (Buffer.concat(chunks).length > 1024 * 1024) {
      throw new Error("Payload quá lớn");
    }
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function normalizeNotice(input, existing = {}) {
  const now = new Date().toISOString();
  const durationSeconds = Number(input.durationSeconds ?? existing.durationSeconds ?? 30);
  const sortOrder = Number(input.sortOrder ?? existing.sortOrder ?? 0);

  return {
    id: existing.id || crypto.randomUUID(),
    type: ["TEXT", "IMAGE", "MIXED"].includes(input.type) ? input.type : existing.type || "TEXT",
    title: String(input.title ?? existing.title ?? "").trim(),
    content: String(input.content ?? existing.content ?? "").trim(),
    displayGroup: String(input.displayGroup ?? existing.displayGroup ?? "xuong-a").trim() || "xuong-a",
    level: ["NORMAL", "IMPORTANT", "URGENT"].includes(input.level) ? input.level : existing.level || "NORMAL",
    durationSeconds: Number.isFinite(durationSeconds) ? Math.min(Math.max(durationSeconds, 5), 600) : 30,
    isActive: Boolean(input.isActive ?? existing.isActive ?? true),
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    backgroundColor: String(input.backgroundColor ?? existing.backgroundColor ?? "#111827"),
    textColor: String(input.textColor ?? existing.textColor ?? "#f9fafb"),
    imageUrl: String(input.imageUrl ?? existing.imageUrl ?? "").trim(),
    fitMode: ["cover", "contain"].includes(input.fitMode) ? input.fitMode : existing.fitMode || "cover",
    createdAt: existing.createdAt || now,
    updatedAt: now
  };
}

function validateNotice(notice) {
  if (!notice.title && !notice.content && !notice.imageUrl) {
    return "Cần nhập tiêu đề, nội dung hoặc đường dẫn ảnh.";
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(notice.backgroundColor)) {
    return "Màu nền phải đúng định dạng #RRGGBB.";
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(notice.textColor)) {
    return "Màu chữ phải đúng định dạng #RRGGBB.";
  }
  return null;
}

async function handleApi(req, res, url) {
  const store = await readStore();

  if (req.method === "GET" && url.pathname === "/api/notices") {
    return sendJson(res, 200, store);
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/display/")) {
    const groupCode = decodeURIComponent(url.pathname.replace("/api/display/", "").replace("/notices", ""));
    const notices = store.notices
      .filter((notice) => notice.isActive && notice.displayGroup === groupCode)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt));

    return sendJson(res, 200, {
      groupCode,
      updatedAt: store.updatedAt,
      serverTime: new Date().toISOString(),
      notices
    });
  }

  if (req.method === "POST" && url.pathname === "/api/notices") {
    const body = await readBody(req);
    const notice = normalizeNotice(body);
    const validationError = validateNotice(notice);
    if (validationError) return sendJson(res, 400, { error: validationError });

    store.notices.push(notice);
    await writeStore(store);
    return sendJson(res, 201, notice);
  }

  const noticeMatch = url.pathname.match(/^\/api\/notices\/([^/]+)$/);
  if (noticeMatch && req.method === "PUT") {
    const id = decodeURIComponent(noticeMatch[1]);
    const index = store.notices.findIndex((notice) => notice.id === id);
    if (index === -1) return sendJson(res, 404, { error: "Không tìm thấy thông báo." });

    const body = await readBody(req);
    const notice = normalizeNotice(body, store.notices[index]);
    const validationError = validateNotice(notice);
    if (validationError) return sendJson(res, 400, { error: validationError });

    store.notices[index] = notice;
    await writeStore(store);
    return sendJson(res, 200, notice);
  }

  if (noticeMatch && req.method === "DELETE") {
    const id = decodeURIComponent(noticeMatch[1]);
    const nextNotices = store.notices.filter((notice) => notice.id !== id);
    if (nextNotices.length === store.notices.length) {
      return sendJson(res, 404, { error: "Không tìm thấy thông báo." });
    }

    store.notices = nextNotices;
    await writeStore(store);
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 404, { error: "Không tìm thấy API." });
}

async function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/admin/";
  if (pathname === "/admin") pathname = "/admin/";
  if (pathname === "/display") pathname = "/display/";
  if (pathname.endsWith("/")) pathname += "index.html";

  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    return sendText(res, 403, "Forbidden");
  }

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": contentTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=60"
    });
    res.end(data);
  } catch (error) {
    sendText(res, 404, "Not found");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  try {
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }

    await serveStatic(req, res, url);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Lỗi server" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Factory TV Notice đang chạy: http://localhost:${PORT}`);
  console.log(`Admin:   http://localhost:${PORT}/admin/`);
  console.log(`TV demo: http://localhost:${PORT}/display/?group=xuong-a`);
});
