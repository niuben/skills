import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database, { type Database as DB } from "better-sqlite3";
import { ensureDir } from "@skillos/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SqliteOptions {
  /** Absolute path to the sqlite db file */
  file: string;
  /** Print SQL statements */
  verbose?: boolean;
}

export async function openDatabase(opts: SqliteOptions): Promise<DB> {
  await ensureDir(path.dirname(opts.file));
  const db = new Database(opts.file, opts.verbose ? { verbose: console.log } : {});
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  applySchema(db);
  return db;
}

function applySchema(db: DB): void {
  // schema.sql is a sibling file; in dev we read from src/, in build from dist/
  const candidates = [
    path.join(__dirname, "schema.sql"),
    path.join(__dirname, "../../src/db/schema.sql"),
  ];
  const schemaFile = candidates.find((p) => fs.existsSync(p));
  if (!schemaFile) {
    throw new Error(`schema.sql not found, checked: ${candidates.join(", ")}`);
  }
  const sql = fs.readFileSync(schemaFile, "utf8");
  db.exec(sql);
}
