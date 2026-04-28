import type { ArtifactKind, ArtifactRecord } from "./artifact.types.js";

export function makeArtifactId(kind: ArtifactKind, name: string, version: string): string {
  return `${kind}:${name}@${version}`;
}

export function parseArtifactId(id: string): {
  kind: ArtifactKind;
  name: string;
  version: string;
} {
  const match = /^(skill|prompt|agent):([^@]+)@(.+)$/.exec(id);
  if (!match) throw new Error(`Invalid artifact id: ${id}`);
  return { kind: match[1] as ArtifactKind, name: match[2], version: match[3] };
}

export function artifactDisplayName(a: Pick<ArtifactRecord, "kind" | "name" | "version">): string {
  return `${a.kind}/${a.name}@${a.version}`;
}
