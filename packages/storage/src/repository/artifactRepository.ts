import type { Database as DB } from "better-sqlite3";
import type { ArtifactKind, ArtifactRecord } from "@skillos/core";

export interface ArtifactQuery {
  kind?: ArtifactKind;
  name?: string;
  /** Free-text search across name/description/tags */
  text?: string;
  limit?: number;
  offset?: number;
}

export interface ArtifactRepository {
  save(record: ArtifactRecord): void;
  findById(id: string): ArtifactRecord | null;
  findLatest(kind: ArtifactKind, name: string): ArtifactRecord | null;
  findVersions(kind: ArtifactKind, name: string): ArtifactRecord[];
  list(query?: ArtifactQuery): ArtifactRecord[];
  remove(id: string): boolean;
}

interface Row {
  id: string;
  kind: string;
  name: string;
  version: string;
  description: string | null;
  readme: string | null;
  tags: string | null;
  author_name: string | null;
  author_email: string | null;
  license: string | null;
  entry: string | null;
  metadata: string | null;
  content_hash: string;
  size: number;
  storage_path: string;
  published_at: string;
}

function rowToRecord(r: Row): ArtifactRecord {
  return {
    id: r.id,
    kind: r.kind as ArtifactKind,
    name: r.name,
    version: r.version,
    description: r.description ?? undefined,
    readme: r.readme ?? undefined,
    tags: r.tags ? (JSON.parse(r.tags) as string[]) : undefined,
    author: r.author_name ? { name: r.author_name, email: r.author_email ?? undefined } : undefined,
    license: r.license ?? undefined,
    entry: r.entry ?? undefined,
    metadata: r.metadata ? (JSON.parse(r.metadata) as Record<string, unknown>) : undefined,
    contentHash: r.content_hash,
    size: r.size,
    storagePath: r.storage_path,
    publishedAt: r.published_at,
  };
}

export function createArtifactRepository(db: DB): ArtifactRepository {
  const insertVersion = db.prepare(`
    INSERT INTO artifact_versions
      (id, kind, name, version, description, readme, tags,
       author_name, author_email, license, entry, metadata,
       content_hash, size, storage_path, published_at)
    VALUES
      (@id, @kind, @name, @version, @description, @readme, @tags,
       @author_name, @author_email, @license, @entry, @metadata,
       @content_hash, @size, @storage_path, @published_at)
    ON CONFLICT(id) DO UPDATE SET
       description = excluded.description,
       readme      = excluded.readme,
       tags        = excluded.tags,
       author_name = excluded.author_name,
       author_email= excluded.author_email,
       license     = excluded.license,
       entry       = excluded.entry,
       metadata    = excluded.metadata,
       content_hash= excluded.content_hash,
       size        = excluded.size,
       storage_path= excluded.storage_path,
       published_at= excluded.published_at
  `);

  const upsertLatest = db.prepare(`
    INSERT INTO artifacts
      (id, kind, name, version, description, readme, tags,
       author_name, author_email, license, entry, metadata,
       content_hash, size, storage_path, published_at)
    VALUES
      (@id, @kind, @name, @version, @description, @readme, @tags,
       @author_name, @author_email, @license, @entry, @metadata,
       @content_hash, @size, @storage_path, @published_at)
    ON CONFLICT(kind, name) DO UPDATE SET
       id          = excluded.id,
       version     = excluded.version,
       description = excluded.description,
       readme      = excluded.readme,
       tags        = excluded.tags,
       author_name = excluded.author_name,
       author_email= excluded.author_email,
       license     = excluded.license,
       entry       = excluded.entry,
       metadata    = excluded.metadata,
       content_hash= excluded.content_hash,
       size        = excluded.size,
       storage_path= excluded.storage_path,
       published_at= excluded.published_at
  `);

  const selectById = db.prepare<[string]>(`SELECT * FROM artifact_versions WHERE id = ?`);
  const selectLatest = db.prepare<[string, string]>(`SELECT * FROM artifacts WHERE kind = ? AND name = ?`);
  const selectVersions = db.prepare<[string, string]>(
    `SELECT * FROM artifact_versions WHERE kind = ? AND name = ? ORDER BY published_at DESC`
  );
  const deleteVersionById = db.prepare<[string]>(`DELETE FROM artifact_versions WHERE id = ?`);
  const deleteLatestByName = db.prepare<[string, string]>(`DELETE FROM artifacts WHERE kind = ? AND name = ?`);

  const save = db.transaction((record: ArtifactRecord) => {
    const row = toRow(record);
    insertVersion.run(row);

    const currentLatest = selectLatest.get(record.kind, record.name) as Row | undefined;
    if (!currentLatest || currentLatest.id === record.id || currentLatest.published_at <= record.publishedAt) {
      upsertLatest.run(row);
    }
  });

  const remove = db.transaction((id: string) => {
    const current = selectById.get(id) as Row | undefined;
    if (!current) {
      return false;
    }

    deleteVersionById.run(id);

    const latest = selectLatest.get(current.kind, current.name) as Row | undefined;
    if (latest?.id === id) {
      const next = selectVersions.get(current.kind, current.name) as Row | undefined;
      if (next) {
        upsertLatest.run(toRow(rowToRecord(next)));
      } else {
        deleteLatestByName.run(current.kind, current.name);
      }
    }

    return true;
  });

  return {
    save(record) {
      save(record);
    },

    findById(id) {
      const row = selectById.get(id) as Row | undefined;
      return row ? rowToRecord(row) : null;
    },

    findLatest(kind, name) {
      const row = selectLatest.get(kind, name) as Row | undefined;
      return row ? rowToRecord(row) : null;
    },

    findVersions(kind, name) {
      const rows = selectVersions.all(kind, name) as Row[];
      return rows.map(rowToRecord);
    },

    list(query = {}) {
      const where: string[] = [];
      const params: Record<string, unknown> = {};

      if (query.kind) {
        where.push(`kind = @kind`);
        params.kind = query.kind;
      }
      if (query.name) {
        where.push(`name = @name`);
        params.name = query.name;
      }
      if (query.text) {
        where.push(`(name LIKE @q OR description LIKE @q OR tags LIKE @q)`);
        params.q = `%${query.text}%`;
      }

      const sql = `
        SELECT * FROM artifacts
        ${where.length ? "WHERE " + where.join(" AND ") : ""}
        ORDER BY published_at DESC
        LIMIT @limit OFFSET @offset
      `;
      params.limit = query.limit ?? 100;
      params.offset = query.offset ?? 0;

      const rows = db.prepare(sql).all(params) as Row[];
      return rows.map(rowToRecord);
    },

    remove(id) {
      return remove(id);
    },
  };
}

function toRow(record: ArtifactRecord): Record<string, unknown> {
  return {
    id: record.id,
    kind: record.kind,
    name: record.name,
    version: record.version,
    description: record.description ?? null,
    readme: record.readme ?? null,
    tags: record.tags ? JSON.stringify(record.tags) : null,
    author_name: record.author?.name ?? null,
    author_email: record.author?.email ?? null,
    license: record.license ?? null,
    entry: record.entry ?? null,
    metadata: record.metadata ? JSON.stringify(record.metadata) : null,
    content_hash: record.contentHash,
    size: record.size,
    storage_path: record.storagePath,
    published_at: record.publishedAt,
  };
}
