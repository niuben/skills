import type { ArtifactRecord } from "@skillos/core";
import type { ArtifactRepository, FileStorage } from "@skillos/storage";
import type { RegistryClient } from "@skillos/registry-client";
import { createLogger, sha256Buffer } from "@skillos/utils";

export interface SyncServiceDeps {
  repository: ArtifactRepository;
  storage: FileStorage;
  registry: RegistryClient;
}

export interface SyncReport {
  fetched: ArtifactRecord[];
  skipped: ArtifactRecord[];
  failed: { id: string; error: string }[];
}

export class SyncService {
  private readonly log = createLogger("sync");

  constructor(private readonly deps: SyncServiceDeps) {}

  /** Pull every artifact from the remote registry that is missing locally. */
  async pullAll(): Promise<SyncReport> {
    const report: SyncReport = { fetched: [], skipped: [], failed: [] };

    const remote = await this.deps.registry.search({ limit: 1000 });
    for (const record of remote.items) {
      try {
        const local = this.deps.repository.findById(record.id);
        if (local && (await this.deps.storage.has(local.storagePath))) {
          report.skipped.push(record);
          continue;
        }
        const payload = await this.deps.registry.download(record.id);
        if (sha256Buffer(payload) !== record.contentHash) {
          throw new Error("content hash mismatch");
        }
        await this.deps.storage.put(record.storagePath, payload);
        this.deps.repository.save(record);
        report.fetched.push(record);
        this.log.info(`synced ${record.id}`);
      } catch (err) {
        report.failed.push({ id: record.id, error: (err as Error).message });
        this.log.warn(`failed ${record.id}: ${(err as Error).message}`);
      }
    }

    return report;
  }
}
