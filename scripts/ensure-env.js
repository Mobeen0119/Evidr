const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const envPath = path.join(process.cwd(), ".env");
const secretName = "SESSION_SECRET";

function readEnv() {
  if (!fs.existsSync(envPath)) return {};
  const text = fs.readFileSync(envPath, "utf8");
  const lines = text.split("\n");
  const map = {};
  for (const line of lines) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (match) map[match[1]] = match[2];
  }
  return map;
}

function writeLine(key, value) {
  const line = `${key}="${value}"\n`;
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, line);
    return;
  }
  const existing = fs.readFileSync(envPath, "utf8");
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(existing)) {
    fs.writeFileSync(envPath, existing.replace(pattern, line.trim()));
  } else {
    fs.writeFileSync(envPath, existing.endsWith("\n") || existing === "" ? existing + line : existing + "\n" + line);
  }
}

const env = readEnv();
const current = env[secretName];

if (!current || current.replace(/^"|"$/g, "").length < 16) {
  const generated = crypto.randomBytes(48).toString("hex");
  writeLine(secretName, generated);
  console.log("[setup] Generated a local SESSION_SECRET in .env (first run). Keep this file private.");
}

if (!env.DATABASE_URL) {
  writeLine("DATABASE_URL", "file:./data/app.db");
}
