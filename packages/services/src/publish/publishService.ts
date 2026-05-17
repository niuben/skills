import {
  createArtifactRecord,
  type ArtifactPublishInput,
  type ArtifactRecord,
} from "@taoai/skill-core";
import type { ArtifactRepository, FileStorage, PathResolver } from "@taoai/skill-storage";
import { createLogger } from "@taoai/skill-utils";

export interface PublishServiceDeps {
  repository: ArtifactRepository;
  storage: FileStorage;
  resolver: PathResolver;
  getDefaultApprovalStatus?: () => NonNullable<ArtifactRecord["approvalStatus"]>;
}

export class PublishService {
  private readonly log = createLogger("publish");

  constructor(private readonly deps: PublishServiceDeps) {}

  async publish(input: ArtifactPublishInput): Promise<ArtifactRecord> {
    const legacyAuthor = (input.manifest as unknown as { author?: { name?: string } }).author?.name;
    const normalizedManifest = {
      ...input.manifest,
      author_name: input.manifest.author_name ?? legacyAuthor,
    };

    const storagePath = this.deps.resolver.buildStoragePath(normalizedManifest);

    const record = createArtifactRecord({ ...input, manifest: normalizedManifest }, { storagePath });
    record.approvalStatus = this.deps.getDefaultApprovalStatus?.() ?? "approved";
    this.log.info(`publishing ${record.id} (${record.size} bytes)`);

    await this.deps.storage.put(storagePath, input.payload);
    this.deps.repository.save(record);

    return record;
  }
}
