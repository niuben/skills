import path from "node:path";
import fs from "node:fs/promises";
import * as tar from "tar";
import {
  makeArtifactId,
  parseArtifactId,
  type ArtifactKind,
  type ArtifactRecord,
} from "@skillsos/core";
import type { ArtifactRepository, FileStorage } from "@skillsos/storage";
import type { RegistryClient } from "@skillsos/registry-client";
import { createLogger, ensureDir, sha256Buffer } from "@skillsos/utils";
import { AGENT_DIR_CONFIG, expandPath, findPlatformByProjectDir } from "@skillsos/config";

/**
 * Find the actual project root by walking up directories looking for .git
 */
async function findProjectRoot(startDir: string): Promise<string> {
  let currentDir = startDir;
  while (currentDir !== path.dirname(currentDir)) {
    try {
      await fs.access(path.join(currentDir, ".git"));
      return currentDir;
    } catch {
      currentDir = path.dirname(currentDir);
    }
  }
  return startDir;
}

export interface AgentPlatformInfo {
  platform: string;
  path: string;
  isProject: boolean;
}

export interface InstallServiceDeps {
  repository: ArtifactRepository;
  storage: FileStorage;
  /** Optional remote registry to pull from when artifact is missing locally */
  registry?: RegistryClient;
  /** Where artifacts get installed for consumers */
  installRoot: string;
  /** Optional callback to select install path (for CLI interactivity) */
  selectInstallPath?: (
    options: AgentPlatformInfo[]
  ) => Promise<string | null>;
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

    if (kinds.has("skills") && kinds.size === 1) {
      const preferred = await this.resolveLatest("skills", name);
      if (!preferred) {
        throw new Error(`artifact skills:${name} not found locally or in configured registry`);
      }
      const { record, payload } = await this.loadById(preferred.id);
      return this.persistInstall(record, payload, "skills", name, preferred.version);
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
      record = normalizeRecord(record);
    } else if (this.deps.registry) {
      this.log.info(`fetching ${id} from remote registry`);
      record = await this.deps.registry.getMetadata(id);
      payload = await this.deps.registry.download(id);

      record = normalizeRecord(record);

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

    for (const queryKind of aliasKinds(kind)) {
      const remoteVersions = await this.deps.registry
        .listVersions(queryKind as ArtifactKind, name)
        .catch(() => [] as ArtifactRecord[]);
      if (remoteVersions.length > 0) {
        return remoteVersions[0];
      }
    }

    return null;
  }

  private async discoverKinds(name: string): Promise<Set<ArtifactKind>> {
    const kinds = new Set<ArtifactKind>();

    for (const item of this.deps.repository.list({ name, limit: 1000 })) {
      if (item.name === name) {
        const normalized = normalizeKind(item.kind);
        if (normalized) kinds.add(normalized);
      }
    }

    if (!this.deps.registry) {
      return kinds;
    }

    const remote = await this.deps.registry.search({ text: name, limit: 1000 }).catch(() => ({
      total: 0,
      items: [] as ArtifactRecord[],
    }));
    for (const item of remote.items) {
      if (item.name === name) {
        const normalized = normalizeKind(item.kind);
        if (normalized) kinds.add(normalized);
      }
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

    // Detect available installation paths
    let installPath = path.join(this.deps.installRoot, kind, name);

    if (this.deps.selectInstallPath) {
      const availablePaths = await this.discoverAgentPaths(kind, name);
      if (availablePaths.length > 0) {
        const selectedPath = await this.deps.selectInstallPath(availablePaths);
        if (selectedPath) {
          installPath = selectedPath;
        }
      }
    }

    await fs.rm(installPath, { recursive: true, force: true });
    await ensureDir(installPath);

    const payloadFile = path.join(installPath, "payload.bin");
    const manifestFile = path.join(installPath, "manifest.json");
    await fs.writeFile(payloadFile, payload);
    await fs.writeFile(manifestFile, JSON.stringify(record, null, 2));

    try {
      await tar.x({ file: payloadFile, cwd: installPath, gzip: true });
    } catch (err) {
      throw new Error(`failed to extract payload for ${id}: ${(err as Error).message}`);
    }

    await fs.unlink(payloadFile);
    await fs.unlink(manifestFile);

    this.log.info(`installed ${id} -> ${installPath}`);
    return { record, installPath };
  }

  private async discoverAgentPaths(kind: ArtifactKind, name: string): Promise<AgentPlatformInfo[]> {
    const paths: AgentPlatformInfo[] = [];
    const cwd = await findProjectRoot(process.cwd());
    const seenPaths = new Set<string>();

    // First: Check for project-level directories
    for (const config of AGENT_DIR_CONFIG) {
      for (const projectPath of config.skills.project) {
        // Extract the base directory name (e.g., ".windsurf" from ".windsurf/skills/")
        const baseDirName = projectPath.split("/")[0];
        // Project path already includes the destination, e.g., ".windsurf/skills/"
        const fullPath = path.join(cwd, projectPath, name);
        const checkPath = path.join(cwd, baseDirName);

        try {
          // Check if the base directory exists
          await fs.access(checkPath);

          // Avoid duplicate paths
          if (!seenPaths.has(fullPath)) {
            seenPaths.add(fullPath);
            paths.push({
              platform: config.name,
              path: fullPath,
              isProject: true,
            });
          }
        } catch {
          // Directory doesn't exist
        }
      }
    }

    // If project paths found, return them (project-level has priority)
    if (paths.length > 0) {
      return paths;
    }

    // Second: Check for system-level directories
    for (const config of AGENT_DIR_CONFIG) {
      for (const systemPath of config.skills.system) {
        const expandedPath = expandPath(systemPath);
        // System path already includes the destination, e.g., "~/.agents/skills/"
        const fullPath = path.join(expandedPath, name);

        try {
          // Check if the system directory exists
          await fs.access(expandedPath);

          // Avoid duplicate paths
          if (!seenPaths.has(fullPath)) {
            seenPaths.add(fullPath);
            paths.push({
              platform: config.name,
              path: fullPath,
              isProject: false,
            });
          }
        } catch {
          // Directory doesn't exist
        }
      }
    }

    return paths;
  }
}

function normalizeKind(kind: string): ArtifactKind | undefined {
  if (kind === "skill") return "skills";
  if (kind === "skills" || kind === "prompt" || kind === "agent") {
    return kind;
  }
  return undefined;
}

function aliasKinds(kind: ArtifactKind): string[] {
  return kind === "skills" ? ["skills", "skill"] : [kind];
}

function normalizeRecord(record: ArtifactRecord): ArtifactRecord {
  if ((record.kind as string) !== "skill") {
    return record;
  }

  return {
    ...record,
    kind: "skills",
    id: record.id.replace(/^skill:/, "skills:"),
    storagePath: record.storagePath.replace(/^skill\//, "skills/"),
  };
}
