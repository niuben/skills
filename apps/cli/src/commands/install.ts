import type { Command } from "commander";
import type { ArtifactKind } from "@skillos/core";
import { buildContext, fail } from "../utils.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install <nameOrId>")
    .description("Install by name (default kind: skill) or explicit id (kind:name@version)")
    .option("-k, --kind <kind>", "Artifact kind when installing by name (skill|prompt|agent)")
    .action(async (nameOrId: string, opts: { kind?: ArtifactKind }) => {
      const ctx = await buildContext();
      let result;
      try {
        if (nameOrId.includes(":") && nameOrId.includes("@")) {
          result = await ctx.installService.installById(nameOrId);
        } else {
          const kind = normalizeKind(opts.kind);
          result = await ctx.installService.installByName(nameOrId, kind);
        }
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes("Invalid artifact id")) {
          fail(`Invalid artifact id: ${nameOrId}. Expected format: skill:name@version, prompt:name@version, or agent:name@version`);
        }
        fail(msg);
      }
      // eslint-disable-next-line no-console
      console.log(`installed ${result.record.id}`);
      // eslint-disable-next-line no-console
      console.log(`  -> ${result.installPath}`);
    });
}

function normalizeKind(kind?: string): ArtifactKind | undefined {
  if (!kind) return undefined;
  if (kind === "skill" || kind === "prompt" || kind === "agent") {
    return kind;
  }
  fail(`invalid kind: ${kind}. Expected one of: skill, prompt, agent`);
}
