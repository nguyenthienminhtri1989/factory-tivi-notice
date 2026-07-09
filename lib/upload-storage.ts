import path from "path";

const DEFAULT_UPLOAD_DIR = process.platform === "win32"
  ? "D:\\TIVI-APP-DATA\\uploads"
  : path.join(process.cwd(), "data", "uploads");

export function getUploadRoot() {
  return process.env.UPLOAD_DIR || process.env.TIVI_UPLOAD_DIR || DEFAULT_UPLOAD_DIR;
}

export function safeUploadParts(parts: string[]) {
  return parts
    .map((part) => String(part || "").trim())
    .filter(Boolean)
    .filter((part) => !part.includes("/") && !part.includes("\\") && part !== "." && part !== "..");
}

export function resolveUploadPath(parts: string[]) {
  const safeParts = safeUploadParts(parts);
  if (safeParts.length !== parts.length || safeParts.length === 0) return null;

  const root = path.resolve(getUploadRoot());
  const fullPath = path.resolve(root, ...safeParts);
  const insideRoot = fullPath === root || fullPath.startsWith(root + path.sep);
  return insideRoot ? fullPath : null;
}

export function uploadPublicUrl(parts: string[]) {
  return "/media/" + safeUploadParts(parts).map(encodeURIComponent).join("/");
}

export function legacyPublicUploadPath(parts: string[]) {
  const safeParts = safeUploadParts(parts);
  if (safeParts.length !== parts.length || safeParts.length === 0) return null;

  const legacyRoot = path.resolve(process.cwd(), "public", "uploads", "notices");
  const fullPath = path.resolve(legacyRoot, ...safeParts);
  const insideRoot = fullPath === legacyRoot || fullPath.startsWith(legacyRoot + path.sep);
  return insideRoot ? fullPath : null;
}
