import type { ArtifactRecord } from "@skillos/core";
import type { ArtifactQuery, ArtifactRepository } from "@skillos/storage";

export interface SearchServiceDeps {
  repository: ArtifactRepository;
}

export class SearchService {
  constructor(private readonly deps: SearchServiceDeps) {}

  list(query: ArtifactQuery = {}): ArtifactRecord[] {
    return this.deps.repository.list(query);
  }

  get(id: string): ArtifactRecord | null {
    return this.deps.repository.findById(id);
  }
}
