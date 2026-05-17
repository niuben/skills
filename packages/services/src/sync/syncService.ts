import type { ArtifactRecord } from "@taoai/skill-core";
import type { ArtifactRepository, FileStorage } from "@taoai/skill-storage";
import { createFileStorage, createPathResolver } from "@taoai/skill-storage";
import type { RegistryClient } from "@taoai/skill-registry-client";
import { createLogger, sha256Buffer } from "@taoai/skill-utils";

export interface SyncServiceDeps {
  repository: ArtifactRepository;
  storage: FileStorage;
  registry: RegistryClient;
}

export interface SyncReport {
  fetched: ArtifactRecord[];
  skipped: ArtifactRecord[];
  unavailable: { id: string; reason: string }[];
  failed: { id: string; error: string }[];
}

export class SyncService {
  private readonly log = createLogger("sync");

  constructor(private readonly deps: SyncServiceDeps) {}

  /** Pull every artifact from the remote registry that is missing locally. */
  async pullAll(): Promise<SyncReport> {
    const report: SyncReport = { fetched: [], skipped: [], unavailable: [], failed: [] };

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
        const message = (err as Error).message;
        if (message.includes("download failed: 404")) {
          report.unavailable.push({ id: record.id, reason: "remote payload missing or not accessible" });
          this.log.warn(`unavailable ${record.id}: remote payload missing or not accessible`);
          continue;
        }
        report.failed.push({ id: record.id, error: message });
        this.log.warn(`failed ${record.id}: ${message}`);
      }
    }

    return report;
  }

  /** Pull only skills artifacts published by the specified username. */
  async pullUserSkills(username: string): Promise<SyncReport> {
    const report: SyncReport = { fetched: [], skipped: [], unavailable: [], failed: [] };

    const remote = await this.deps.registry.search({
      kind: "skills",
      username,
      limit: 1000,
    });

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
        const message = (err as Error).message;
        if (message.includes("download failed: 404")) {
          report.unavailable.push({ id: record.id, reason: "remote payload missing or not accessible" });
          this.log.warn(`unavailable ${record.id}: remote payload missing or not accessible`);
          continue;
        }
        report.failed.push({ id: record.id, error: message });
        this.log.warn(`failed ${record.id}: ${message}`);
      }
    }

    return report;
  }

  /** Pull only skills artifacts published by the specified username to a target directory. */
  async pullUserSkillsTo(username: string, targetDir: string): Promise<SyncReport> {
    const report: SyncReport = { fetched: [], skipped: [], unavailable: [], failed: [] };

    const resolver = createPathResolver(targetDir);
    const storage = createFileStorage(resolver);

    const remote = await this.deps.registry.search({
      kind: "skills",
      username,
      limit: 1000,
    });

    for (const record of remote.items) {
      try {
        const storagePath = resolver.buildStoragePath(record, "tgz");
        if (await storage.has(storagePath)) {
          report.skipped.push(record);
          continue;
        }

        const payload = await this.deps.registry.download(record.id);
        if (sha256Buffer(payload) !== record.contentHash) {
          throw new Error("content hash mismatch");
        }

        await storage.put(storagePath, payload);
        report.fetched.push(record);
        this.log.info(`synced ${record.id} to ${targetDir}`);
      } catch (err) {
        const message = (err as Error).message;
        if (message.includes("download failed: 404")) {
          report.unavailable.push({ id: record.id, reason: "remote payload missing or not accessible" });
          this.log.warn(`unavailable ${record.id}: remote payload missing or not accessible`);
          continue;
        }
        report.failed.push({ id: record.id, error: message });
        this.log.warn(`failed ${record.id}: ${message}`);
      }
    }

    return report;
  }
}
