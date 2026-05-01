import {
  createArtifactRecord,
  type ArtifactPublishInput,
  type ArtifactRecord,
} from "@skillsos/core";
import type { ArtifactRepository, FileStorage, PathResolver } from "@skillsos/storage";
import { createLogger } from "@skillsos/utils";

export interface PublishServiceDeps {
  repository: ArtifactRepository;
  storage: FileStorage;
  resolver: PathResolver;
}

export class PublishService {
  private readonly log = createLogger("publish");

  constructor(private readonly deps: PublishServiceDeps) {}

  async publish(input: ArtifactPublishInput): Promise<ArtifactRecord> {
    const storagePath = this.deps.resolver.buildStoragePath(input.manifest);

    const record = createArtifactRecord(input, { storagePath });
    this.log.info(`publishing ${record.id} (${record.size} bytes)`);

    await this.deps.storage.put(storagePath, input.payload);
    this.deps.repository.save(record);

    return record;
  }
}
