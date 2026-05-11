import type { ArtifactKind, ArtifactManifest, ArtifactRecord } from "@skillshub/core";

export interface RegistryClientOptions {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

export interface PublishRequest {
  manifest: ArtifactManifest;
  payload: Buffer;
}

export interface SearchQuery {
  kind?: ArtifactKind;
  text?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  total: number;
  items: ArtifactRecord[];
}
