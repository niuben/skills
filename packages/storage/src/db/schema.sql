-- skillos sqlite schema
-- Stores artifact metadata; binary blobs live on disk under artifactsDir.

CREATE TABLE IF NOT EXISTS artifacts (
  id            TEXT PRIMARY KEY,            -- kind:name@version
  kind          TEXT NOT NULL,               -- skill | prompt | agent
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
  UNIQUE(kind, name, version)
);

CREATE INDEX IF NOT EXISTS idx_artifacts_kind_name ON artifacts(kind, name);
CREATE INDEX IF NOT EXISTS idx_artifacts_name      ON artifacts(name);
CREATE INDEX IF NOT EXISTS idx_artifacts_published ON artifacts(published_at DESC);

CREATE TABLE IF NOT EXISTS installs (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  artifact_id   TEXT NOT NULL,
  installed_at  TEXT NOT NULL,
  install_path  TEXT NOT NULL,
  FOREIGN KEY(artifact_id) REFERENCES artifacts(id)
);

CREATE INDEX IF NOT EXISTS idx_installs_artifact ON installs(artifact_id);
