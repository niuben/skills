import path from "node:path";
import type { ArtifactKind, ArtifactManifest } from "@skillshub/core";

export interface PathResolver {
  /** Absolute path of the artifact storage root */
  root: string;
  /** Resolve absolute path for a stored artifact blob */
  forArtifact(storagePath: string): string;
  /** Build a canonical relative storage path for a manifest */
  buildStoragePath(manifest: Pick<ArtifactManifest, "kind" | "name" | "version">, ext?: string): string;
  /** Build the directory used for an artifact (without extension) */
  buildArtifactDir(kind: ArtifactKind, name: string): string;
}

export function createPathResolver(artifactsDir: string): PathResolver {
  return {
    root: artifactsDir,
    forArtifact: (storagePath) => path.join(artifactsDir, storagePath),
    buildStoragePath: (m, ext = "tgz") => `${m.kind}/${m.name}/${m.version}.${ext}`,
    buildArtifactDir: (kind, name) => path.join(artifactsDir, kind, name),
  };
}
