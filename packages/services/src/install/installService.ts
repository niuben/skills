import path from "node:path";
import fs from "node:fs/promises";
import {
  makeArtifactId,
  parseArtifactId,
  type ArtifactKind,
  type ArtifactRecord,
} from "@skillos/core";
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
    const { record, payload } = await this.loadById(id);

    return this.persistInstall(record, payload, kind, name, version);
  }

  async installByName(name: string, preferredKind?: ArtifactKind): Promise<InstallResult> {
    const kinds = await this.discoverKinds(name);
    if (kinds.size === 0) {
      throw new Error(`artifact ${name} not found locally or in configured registry`);
    }

    if (preferredKind) {
      if (!kinds.has(preferredKind)) {
        const orderedKinds = [...kinds].sort();
        throw new Error(
          `artifact name '${name}' was not found as ${preferredKind}. Found kinds: ${orderedKinds.join(", ")}. ` +
            `Please choose one with --kind <${orderedKinds.join("|")}>`
        );
      }

      const explicit = await this.resolveLatest(preferredKind, name);
      if (!explicit) {
        throw new Error(`artifact ${preferredKind}:${name} not found locally or in configured registry`);
      }
      const { record, payload } = await this.loadById(explicit.id);
      return this.persistInstall(record, payload, preferredKind, name, explicit.version);
    }

    if (kinds.has("skill") && kinds.size === 1) {
      const preferred = await this.resolveLatest("skill", name);
      if (!preferred) {
        throw new Error(`artifact skill:${name} not found locally or in configured registry`);
      }
      const { record, payload } = await this.loadById(preferred.id);
      return this.persistInstall(record, payload, "skill", name, preferred.version);
    }

    const orderedKinds = [...kinds].sort();
    throw new Error(
      `artifact name '${name}' is ambiguous across kinds: ${orderedKinds.join(", ")}. ` +
        `Please choose one with --kind <${orderedKinds.join("|")}>`
    );
  }

  private async loadById(id: string): Promise<{ record: ArtifactRecord; payload: Buffer }> {
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

    return { record, payload };
  }

  private async resolveLatest(kind: ArtifactKind, name: string): Promise<ArtifactRecord | null> {
    const local = this.deps.repository.findLatest(kind, name);
    if (local) return local;

    if (!this.deps.registry) return null;
    const remoteVersions = await this.deps.registry.listVersions(kind, name).catch(() => [] as ArtifactRecord[]);
    return remoteVersions.length > 0 ? remoteVersions[0] : null;
  }

  private async discoverKinds(name: string): Promise<Set<ArtifactKind>> {
    const kinds = new Set<ArtifactKind>();

    for (const item of this.deps.repository.list({ name, limit: 1000 })) {
      if (item.name === name) kinds.add(item.kind);
    }

    if (!this.deps.registry) {
      return kinds;
    }

    const remote = await this.deps.registry.search({ text: name, limit: 1000 }).catch(() => ({
      total: 0,
      items: [] as ArtifactRecord[],
    }));
    for (const item of remote.items) {
      if (item.name === name) kinds.add(item.kind);
    }

    return kinds;
  }

  private async persistInstall(
    record: ArtifactRecord,
    payload: Buffer,
    kind: ArtifactKind,
    name: string,
    version: string
  ): Promise<InstallResult> {
    const id = makeArtifactId(kind, name, version);

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
