import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, pathExists } from "@skillos/utils";
import type { PathResolver } from "./pathResolver.js";

export interface FileStorage {
  /** Write a payload buffer to the resolved location, returns absolute path */
  put(storagePath: string, payload: Buffer): Promise<string>;
  /** Read payload bytes from storage */
  get(storagePath: string): Promise<Buffer>;
  /** Check existence */
  has(storagePath: string): Promise<boolean>;
  /** Delete blob */
  remove(storagePath: string): Promise<void>;
  /** Resolve to absolute path */
  absolute(storagePath: string): string;
}

export function createFileStorage(resolver: PathResolver): FileStorage {
  return {
    async put(storagePath, payload) {
      const abs = resolver.forArtifact(storagePath);
      await ensureDir(path.dirname(abs));
      await fs.writeFile(abs, payload);
      return abs;
    },
    async get(storagePath) {
      const abs = resolver.forArtifact(storagePath);
      return fs.readFile(abs);
    },
    has(storagePath) {
      return pathExists(resolver.forArtifact(storagePath));
    },
    async remove(storagePath) {
      const abs = resolver.forArtifact(storagePath);
      if (await pathExists(abs)) await fs.unlink(abs);
    },
    absolute: (storagePath) => resolver.forArtifact(storagePath),
  };
}
