import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as tar from "tar";
import { handlerRegistry, type Artifact, type FileEntry } from "@skillos/core";

function hash(content: Buffer): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function readDirRecursive(dir: string, base = dir): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];
  const children = await fs.readdir(dir, { withFileTypes: true });

  for (const child of children) {
    const fullPath = path.join(dir, child.name);
    if (child.isDirectory()) {
      entries.push(...(await readDirRecursive(fullPath, base)));
      continue;
    }

    if (!child.isFile()) {
      continue;
    }

    const content = await fs.readFile(fullPath);
    entries.push({
      path: path.relative(base, fullPath).replace(/\\/g, "/"),
      content,
      hash: hash(content),
    });
  }

  return entries;
}

function inferIdentity(type: string, manifest: unknown): { id: string; name: string; version?: string } {
  const candidate = manifest as Partial<{ name: string; version: string }>;
  const name = candidate.name;
  const version = candidate.version;

  if (!name) {
    throw new Error(`Parsed ${type} manifest must include name`);
  }

  return { id: version ? `${name}@${version}` : name, name, version };
}

export class ArtifactLoader {
  async loadFromDir(dir: string): Promise<Artifact> {
    const files = await readDirRecursive(dir);
    const handler = handlerRegistry.detect(files);

    const parsed = handler.parse(files);
    const manifest = handler.validate ? handler.validate(parsed) : parsed;
    const identity = inferIdentity(handler.type, manifest);

    return {
      ...identity,
      type: handler.type as Artifact["type"],
      manifest,
      files,
      meta: { createdAt: Date.now() },
    };
  }

  async loadFromTarball(file: string): Promise<Artifact> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skillos-loader-"));
    try {
      await tar.x({ file, cwd: tmpDir });
      return await this.loadFromDir(tmpDir);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  async loadFromBuffer(buffer: Buffer): Promise<Artifact> {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skillos-loader-"));
    const tgz = path.join(tmpDir, "artifact.tgz");

    try {
      await fs.writeFile(tgz, buffer);
      return await this.loadFromTarball(tgz);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
}

export async function createTarballFromDir(dir: string, outFile: string): Promise<string> {
  await fs.mkdir(path.dirname(outFile), { recursive: true });
  const list = await fs.readdir(dir);
  await tar.c({ gzip: true, cwd: dir, file: outFile }, list);
  return outFile;
}
