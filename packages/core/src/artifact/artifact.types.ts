/**
 * Domain types for the Artifact aggregate.
 *
 * There are two supported modes:
 * 1) Manifest-driven publishing (legacy registry flows)
 * 2) Convention-driven loading (files + handler parser)
 */

export type ArtifactType = "skills" | "prompt" | "agent";
export type ArtifactKind = ArtifactType;

export interface FileEntry {
  /** Relative path inside artifact */
  path: string;
  /** Raw file content */
  content: Buffer;
  /** Optional content hash */
  hash?: string;
}

export interface Artifact<T = unknown> {
  id: string;
  name: string;
  version?: string;
  type: ArtifactType;
  manifest: T;
  files: FileEntry[];
  meta?: {
    author?: string;
    tags?: string[];
    createdAt?: number;
  };
}

export interface ArtifactAuthor {
  name: string;
  email?: string;
}

export interface ArtifactManifest {
  /** Type of artifact */
  kind: ArtifactKind;
  /** Unique name within its kind, e.g. "team/code-review" */
  name: string;
  /** Semver version string */
  version: string;
  /** Short human description */
  description?: string;
  /** Long readme content (markdown) */
  readme?: string;
  /** Tags for search */
  tags?: string[];
  /** Author info */
  author?: ArtifactAuthor;
  /** License identifier (SPDX) */
  license?: string;
  /** Entry file relative to the artifact root */
  entry?: string;
  /** Free-form metadata bag (kind-specific) */
  metadata?: Record<string, unknown>;
}

export interface ArtifactRecord extends ArtifactManifest {
  /** Stable artifact id: `${kind}:${name}@${version}` */
  id: string;
  /** SHA-256 of the packaged tarball / file blob */
  contentHash: string;
  /** Size of stored payload in bytes */
  size: number;
  /** ISO timestamp when published */
  publishedAt: string;
  /** Storage path (relative to artifactsDir) */
  storagePath: string;
  /** Review status used by the admin system */
  approvalStatus?: "approved" | "pending" | "rejected";
}

export interface ArtifactPublishInput {
  manifest: ArtifactManifest;
  /** Raw payload (e.g. tarball) */
  payload: Buffer;
}
