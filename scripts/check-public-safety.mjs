import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
  encoding: "utf8",
})
  .split(/\r?\n/)
  .filter(Boolean);

const localPathPatterns = [
  new RegExp(["C:", "\\\\", "Users", "\\\\"].join(""), "i"),
  new RegExp(["C:", "/", "Users", "/"].join(""), "i"),
  new RegExp(["D:", "\\\\"].join(""), "i"),
  new RegExp(["/", "Users", "/"].join(""), "i"),
  new RegExp(["/", "home", "/"].join(""), "i"),
];
const secretPattern = new RegExp(
  ["api", "[_-]?", "key", "|", "password", "|", "credential", "|", "private", "[_-]?", "key"].join(""),
  "i",
);
const privateDataNames = [
  ["config", ".", "json"].join(""),
  ["sessions", ".", "jsonl"].join(""),
  ["notes", ".", "json"].join(""),
];
const privateImagePattern = new RegExp(["private", "[-_ ]", "screen", "shot"].join(""), "i");

const findings = [];
for (const file of files) {
  const normalized = file.replaceAll("\\", "/");
  if (privateDataNames.some((name) => normalized.endsWith(`/${name}`) || normalized === name)) {
    findings.push(`${file}: private runtime data filename`);
    continue;
  }
  const buffer = readFileSync(file);
  if (buffer.includes(0)) continue;
  const content = buffer.toString("utf8");
  if (localPathPatterns.some((pattern) => pattern.test(content))) findings.push(`${file}: local absolute path`);
  if (secretPattern.test(content) && /[:=]\s*["'][^"']{8,}["']/.test(content)) {
    findings.push(`${file}: credential-like assignment`);
  }
  if (privateImagePattern.test(content)) findings.push(`${file}: non-public image reference`);
}

if (findings.length > 0) {
  console.error("Public safety check failed:");
  for (const finding of findings) console.error(`- ${finding}`);
  process.exit(1);
}

console.log(`Public safety check passed (${files.length} files scanned).`);
