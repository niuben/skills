import path from "node:path";
import fs from "node:fs/promises";
import { parseArtifactId, type ArtifactRecord } from "@skillos/core";
import type { ArtifactRepository, FileStorage } from "@skillos/storage";
import type { RegistryClient } from "@skillos/registry-client";
import { createLogger, ensureDir, sha256Buffer } from "@skillos/utils";

export interface InstallServiceDeps {
  repository: ArtifactRepository;
  storage: FileStorage;
  /** Optional remote registry to pull from when artifact is missing locally */
  registry?: RegistryClient;
  /** Where artifacts get installed for consumers */
  installRoot: string;
}

export interface InstallResult {
  record: ArtifactRecord;
  installPath: string;
}

export class InstallService {
  private readonly log = createLogger("install");

  constructor(private readonly deps: InstallServiceDeps) {}

  async installById(id: string): Promise<InstallResult> {
    const { kind, name, version } = parseArtifactId(id);

    let record = this.deps.repository.findById(id);
    let payload: Buffer;

    if (record && (await this.deps.storage.has(record.storagePath))) {
      payload = await this.deps.storage.get(record.storagePath);
    } else if (this.deps.registry) {
      this.log.info(`fetching ${id} from remote registry`);
      record = await this.deps.registry.getMetadata(id);
      payload = await this.deps.registry.download(id);

      const actual = sha256Buffer(payload);
      if (actual !== record.contentHash) {
        throw new Error(`content hash mismatch for ${id}: expected ${record.contentHash}, got ${actual}`);
      }
      await this.deps.storage.put(record.storagePath, payload);
      this.deps.repository.save(record);
    } else {
      throw new Error(`artifact ${id} not found locally and no registry configured`);
    }

    const installPath = path.join(this.deps.installRoot, kind, name, version);
    await ensureDir(installPath);
    // For now we drop the raw payload at the install location.
    // Real implementation would extract a tarball.
    await fs.writeFile(path.join(installPath, "payload.bin"), payload);
    await fs.writeFile(path.join(installPath, "manifest.json"), JSON.stringify(record, null, 2));

    this.log.info(`installed ${id} -> ${installPath}`);
    return { record, installPath };
  }
}
