import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Command } from "commander";
import {
  makeArtifactId,
  validateManifest,
  type ArtifactKind,
  type ArtifactManifest,
  type ArtifactType,
} from "@taoai/skill-core";
import { registerBuiltinHandlers } from "@taoai/skill-handlers";
import { ArtifactLoader, createTarballFromDir } from "@taoai/skill-loader";
import { buildContext, fail } from "../utils.js";

export function registerPublishCommand(program: Command): void {
  program
    .command("publish")
    .description("Publish artifact from manifest+payload or convention-driven source directory")
    .option("-m, --manifest <file>", "Path to manifest.json (legacy mode)")
    .option("-p, --payload <file>", "Path to packaged payload (e.g. tarball, legacy mode)")
    .option("-s, --source <dir>", "Path to source directory (auto detect type + auto pack)")
    .option("-v, --version <version>", "Version to publish")
    .action(async (opts: { manifest?: string; payload?: string; source?: string; version?: string }) => {
      const ctx = await buildContext();
      let manifest: ArtifactManifest;
      let payload: Buffer;

      if (opts.source) {
        registerBuiltinHandlers();
        const sourceDir = path.resolve(opts.source);
        const loader = new ArtifactLoader();
        const artifact = await loader.loadFromDir(sourceDir);
        const version = opts.version ?? nextGeneratedVersion(ctx.repository, artifact.type, artifact.name);

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skillos-publish-"));
        try {
          const tarFile = await createTarballFromDir(sourceDir, path.join(tmpDir, `${artifact.name}-${version}.tgz`));
          payload = await fs.readFile(tarFile);
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }

        manifest = toPublishManifest(artifact.type, artifact.manifest, version);
      } else {
        if (!opts.manifest || !opts.payload) {
          fail("Either --source or both --manifest and --payload are required");
        }

        const manifestRaw = await fs.readFile(path.resolve(opts.manifest), "utf8");
        try {
          const parsed = JSON.parse(manifestRaw) as Record<string, unknown>;
          if (opts.version) parsed.version = opts.version;
          manifest = validateManifest(parsed) as ArtifactManifest;
        } catch (err) {
          fail(`invalid manifest: ${(err as Error).message}`);
        }

        payload = await fs.readFile(path.resolve(opts.payload));
      }

      const record = await ctx.publishService.publish({ manifest, payload });

      // eslint-disable-next-line no-console
      console.log(`published ${record.id}`);
      // eslint-disable-next-line no-console
      console.log(`  hash:  ${record.contentHash}`);
      // eslint-disable-next-line no-console
      console.log(`  size:  ${record.size}`);
      // eslint-disable-next-line no-console
      console.log(`  path:  ${record.storagePath}`);
    });
}

function toPublishManifest(type: ArtifactType, manifest: unknown, version: string): ArtifactManifest {
  const m = manifest as Record<string, unknown>;
  const name = String(m.name ?? "");

  if (!name) {
    throw new Error(`parsed ${type} manifest missing name`);
  }

  return validateManifest({
    kind: type,
    name,
    version,
    description: typeof m.description === "string" ? m.description : undefined,
    readme: typeof m.rawMarkdown === "string" ? m.rawMarkdown : undefined,
    tags: Array.isArray(m.tags) ? m.tags.filter((v): v is string => typeof v === "string") : undefined,
    entry: typeof m.entry === "string" ? m.entry : undefined,
    metadata: m,
  }) as ArtifactManifest;
}

function nextGeneratedVersion(
  repository: { findById(id: string): ArtifactManifest | null },
  kind: ArtifactKind,
  name: string
): string {
  const now = new Date();
  const base = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;

  let candidate = base;
  let suffix = 0;
  while (repository.findById(makeArtifactId(kind, name, candidate))) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}
