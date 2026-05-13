export type ArtifactKind = "skills" | "prompt" | "agent";

export interface ArtifactRecord {
  id: string;
  kind: ArtifactKind;
  name: string;
  version: string;
  description?: string;
  readme?: string;
  tags?: string[];
  author_name?: string;
  license?: string;
  entry?: string;
  metadata?: Record<string, unknown>;
  contentHash: string;
  size: number;
  storagePath: string;
  publishedAt: string;
}

export interface SearchResult {
  total: number;
  items: ArtifactRecord[];
}
