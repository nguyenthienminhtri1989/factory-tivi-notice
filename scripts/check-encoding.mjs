import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const roots = ["app", "lib"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx"]);
const mojibakePattern = /(áº|á»|Ä|Ă|Æ|Â|�|KhĂ|ThĂ|NhĂ|MĂ|Báº|ChÆ|CĂ|táº|hiá|ná»|dá»|máº|lĂ|xÆ|áº¢|chá»)/;
const failures = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    const ext = name.slice(name.lastIndexOf("."));
    if (!extensions.has(ext)) continue;
    const content = readFileSync(path, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (mojibakePattern.test(line)) failures.push(`${path}:${index + 1}: ${line.trim()}`);
    });
  }
}

roots.forEach(walk);

if (failures.length) {
  console.error("Phát hiện chuỗi có khả năng bị lỗi encoding tiếng Việt:\n");
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Không phát hiện mojibake trong app/lib.");
