-- skillos sqlite schema
-- Stores artifact metadata; binary blobs live on disk under artifactsDir.

CREATE TABLE IF NOT EXISTS artifacts (
  id            TEXT PRIMARY KEY,            -- latest kind:name@version
  kind          TEXT NOT NULL,               -- skills | prompt | agent
  name          TEXT NOT NULL,
  version       TEXT NOT NULL,
  description   TEXT,
  readme        TEXT,
  tags          TEXT,                        -- JSON array
  author_name   TEXT,
  author_email  TEXT,
  license       TEXT,
  entry         TEXT,
  metadata      TEXT,                        -- JSON object
  content_hash  TEXT NOT NULL,
  size          INTEGER NOT NULL,
  storage_path  TEXT NOT NULL,
  published_at  TEXT NOT NULL,
  UNIQUE(kind, name)
);

CREATE TABLE IF NOT EXISTS artifact_versions (
  id            TEXT PRIMARY KEY,            -- kind:name@version
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

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_artifacts_kind_name ON artifacts(kind, name);
CREATE INDEX IF NOT EXISTS idx_artifacts_name      ON artifacts(name);
CREATE INDEX IF NOT EXISTS idx_artifacts_published ON artifacts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_kind_name ON artifact_versions(kind, name);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_name      ON artifact_versions(name);
CREATE INDEX IF NOT EXISTS idx_artifact_versions_published ON artifact_versions(published_at DESC);

CREATE TABLE IF NOT EXISTS installs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  version_id    TEXT NOT NULL,
  installed_at  TEXT NOT NULL,
  install_path  TEXT NOT NULL,
  FOREIGN KEY(version_id) REFERENCES artifact_versions(id)
);

CREATE INDEX IF NOT EXISTS idx_installs_version ON installs(version_id);
