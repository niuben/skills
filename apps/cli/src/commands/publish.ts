import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Command } from "commander";
import { validateManifest, type ArtifactManifest, type ArtifactType } from "@skillos/core";
import { registerBuiltinHandlers } from "@skillos/handlers";
import { ArtifactLoader, createTarballFromDir } from "@skillos/loader";
import { buildContext, fail } from "../utils.js";

export function registerPublishCommand(program: Command): void {
  program
    .command("publish")
    .description("Publish artifact from manifest+payload or convention-driven source directory")
    .option("-m, --manifest <file>", "Path to manifest.json (legacy mode)")
    .option("-p, --payload <file>", "Path to packaged payload (e.g. tarball, legacy mode)")
    .option("-s, --source <dir>", "Path to source directory (auto detect type + auto pack)")
    .action(async (opts: { manifest?: string; payload?: string; source?: string }) => {
      const ctx = await buildContext();
      let manifest: ArtifactManifest;
      let payload: Buffer;

      if (opts.source) {
        registerBuiltinHandlers();
        const sourceDir = path.resolve(opts.source);
        const loader = new ArtifactLoader();
        const artifact = await loader.loadFromDir(sourceDir);

        const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "skillos-publish-"));
        try {
          const tarFile = await createTarballFromDir(sourceDir, path.join(tmpDir, `${artifact.name}-${artifact.version}.tgz`));
          payload = await fs.readFile(tarFile);
        } finally {
          await fs.rm(tmpDir, { recursive: true, force: true });
        }

        manifest = toPublishManifest(artifact.type, artifact.manifest);
      } else {
        if (!opts.manifest || !opts.payload) {
          fail("Either --source or both --manifest and --payload are required");
        }

        const manifestRaw = await fs.readFile(path.resolve(opts.manifest), "utf8");
        try {
          manifest = validateManifest(JSON.parse(manifestRaw)) as ArtifactManifest;
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

function toPublishManifest(type: ArtifactType, manifest: unknown): ArtifactManifest {
  const m = manifest as Record<string, unknown>;
  const name = String(m.name ?? "");
  const version = String(m.version ?? "");

  if (!name || !version) {
    throw new Error(`parsed ${type} manifest missing name/version`);
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
