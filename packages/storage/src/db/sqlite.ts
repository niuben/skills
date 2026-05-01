import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database, { type Database as DB } from "better-sqlite3";
import { ensureDir } from "@skillsos/utils";

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
  migrateLegacySchema(db);
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

function migrateLegacySchema(db: DB): void {
  const artifactsSql = getTableSql(db, "artifacts");
  const installsSql = getTableSql(db, "installs");
  const needsArtifactMigration = /UNIQUE\(kind,\s*name,\s*version\)/i.test(artifactsSql ?? "");
  const needsInstallMigration = /\bartifact_id\b/i.test(installsSql ?? "");

  if (!needsArtifactMigration && !needsInstallMigration) {
    return;
  }

  db.pragma("foreign_keys = OFF");
  try {
    db.exec("BEGIN");

    if (needsArtifactMigration) {
      db.exec(`
        ALTER TABLE artifacts RENAME TO artifacts_old;

        DROP TABLE IF EXISTS artifact_versions;
        CREATE TABLE artifact_versions (
          id            TEXT PRIMARY KEY,
          kind          TEXT NOT NULL,
          name          TEXT NOT NULL,
          version       TEXT NOT NULL,
          description   TEXT,
          readme        TEXT,
          tags          TEXT,
          author_name   TEXT,
          author_email  TEXT,
          license       TEXT,
          entry         TEXT,
          metadata      TEXT,
          content_hash  TEXT NOT NULL,
          size          INTEGER NOT NULL,
          storage_path  TEXT NOT NULL,
          published_at  TEXT NOT NULL,
          UNIQUE(kind, name, version)
        );

        CREATE TABLE artifacts (
          id            TEXT PRIMARY KEY,
          kind          TEXT NOT NULL,
          name          TEXT NOT NULL,
          version       TEXT NOT NULL,
          description   TEXT,
          readme        TEXT,
          tags          TEXT,
          author_name   TEXT,
          author_email  TEXT,
          license       TEXT,
          entry         TEXT,
          metadata      TEXT,
          content_hash  TEXT NOT NULL,
          size          INTEGER NOT NULL,
          storage_path  TEXT NOT NULL,
          published_at  TEXT NOT NULL,
          UNIQUE(kind, name)
        );

        INSERT INTO artifact_versions (
          id, kind, name, version, description, readme, tags,
          author_name, author_email, license, entry, metadata,
          content_hash, size, storage_path, published_at
        )
        SELECT
          id, kind, name, version, description, readme, tags,
          author_name, author_email, license, entry, metadata,
          content_hash, size, storage_path, published_at
        FROM artifacts_old;

        INSERT INTO artifacts (
          id, kind, name, version, description, readme, tags,
          author_name, author_email, license, entry, metadata,
          content_hash, size, storage_path, published_at
        )
        SELECT
          latest.id, latest.kind, latest.name, latest.version, latest.description, latest.readme, latest.tags,
          latest.author_name, latest.author_email, latest.license, latest.entry, latest.metadata,
          latest.content_hash, latest.size, latest.storage_path, latest.published_at
        FROM artifacts_old AS latest
        WHERE latest.id = (
          SELECT candidate.id
          FROM artifacts_old AS candidate
          WHERE candidate.kind = latest.kind AND candidate.name = latest.name
          ORDER BY candidate.published_at DESC, candidate.rowid DESC
          LIMIT 1
        );

        DROP TABLE artifacts_old;

        CREATE INDEX IF NOT EXISTS idx_artifacts_kind_name ON artifacts(kind, name);
        CREATE INDEX IF NOT EXISTS idx_artifacts_name ON artifacts(name);
        CREATE INDEX IF NOT EXISTS idx_artifacts_published ON artifacts(published_at DESC);
        CREATE INDEX IF NOT EXISTS idx_artifact_versions_kind_name ON artifact_versions(kind, name);
        CREATE INDEX IF NOT EXISTS idx_artifact_versions_name ON artifact_versions(name);
        CREATE INDEX IF NOT EXISTS idx_artifact_versions_published ON artifact_versions(published_at DESC);
      `);
    }

    if (needsInstallMigration) {
      db.exec(`
        ALTER TABLE installs RENAME TO installs_old;

        CREATE TABLE installs (
          id            INTEGER PRIMARY KEY AUTOINCREMENT,
          version_id    TEXT NOT NULL,
          installed_at  TEXT NOT NULL,
          install_path  TEXT NOT NULL,
          FOREIGN KEY(version_id) REFERENCES artifact_versions(id)
        );

        INSERT INTO installs (id, version_id, installed_at, install_path)
        SELECT id, artifact_id, installed_at, install_path
        FROM installs_old;

        DROP TABLE installs_old;
        CREATE INDEX IF NOT EXISTS idx_installs_version ON installs(version_id);
      `);
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  } finally {
    db.pragma("foreign_keys = ON");
  }
}

function getTableSql(db: DB, tableName: string): string | undefined {
  const row = db
    .prepare<[string]>("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName) as { sql?: string } | undefined;
  return row?.sql;
}
