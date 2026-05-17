import { sha256Buffer } from "@taoai/skill-utils";
import { makeArtifactId } from "./artifact.js";
import type {
  ArtifactManifest,
  ArtifactPublishInput,
  ArtifactRecord,
} from "./artifact.types.js";
import { validateManifest } from "./artifact.validator.js";

export interface CreateArtifactRecordOptions {
  /** Storage path relative to artifactsDir, e.g. `skill/team/code-review/1.0.0.tgz` */
  storagePath: string;
  /** Pre-computed publish time, defaults to now */
  publishedAt?: string;
}

export function createArtifactRecord(
  input: ArtifactPublishInput,
  opts: CreateArtifactRecordOptions
): ArtifactRecord {
  const manifest = validateManifest(input.manifest) as ArtifactManifest;
  const contentHash = sha256Buffer(input.payload);
  return {
    ...manifest,
    id: makeArtifactId(manifest.kind, manifest.name, manifest.version),
    contentHash,
    size: input.payload.byteLength,
    publishedAt: opts.publishedAt ?? new Date().toISOString(),
    storagePath: opts.storagePath,
  };
}

export function defaultStoragePath(manifest: ArtifactManifest, ext = "tgz"): string {
  return `${manifest.kind}/${manifest.name}/${manifest.version}.${ext}`;
}
