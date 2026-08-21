import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./data/app.db";
const resolvedPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const sqlite = new Database(resolvedPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const SCHEMA_VERSION = 3;

function getStoredVersion(): number {
  const row = sqlite.prepare("SELECT value FROM schema_meta WHERE key = 'version'").get() as { value: string } | undefined;
  return row ? Number(row.value) : 0;
}

sqlite.exec(`CREATE TABLE IF NOT EXISTS schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);

const storedVersion = getStoredVersion();

const CREATE_STATEMENTS = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    name TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS case_records (
    id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, id)
  );
  CREATE INDEX IF NOT EXISTS case_records_user_updated_idx ON case_records (user_id, updated_at);

  CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL,
    window_start INTEGER NOT NULL
  );
`;

if (storedVersion < SCHEMA_VERSION) {
  sqlite.exec(`DROP TABLE IF EXISTS case_records; DROP TABLE IF EXISTS rate_limits; DROP TABLE IF EXISTS users;`);
  sqlite.exec(CREATE_STATEMENTS);
  sqlite.prepare("INSERT INTO schema_meta (key, value) VALUES ('version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(String(SCHEMA_VERSION));
} else {
  sqlite.exec(CREATE_STATEMENTS);
}

export const db = drizzle(sqlite, { schema });
export const rawDb = sqlite;
