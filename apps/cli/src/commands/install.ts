import type { Command } from "commander";
import type { ArtifactKind } from "@skillsos/core";
import type { AgentPlatformInfo } from "@skillsos/services";
import readline from "node:readline";
import { buildContext, fail } from "../utils.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install <nameOrId>")
    .description("Install by name (default kind: skills) or explicit id (kind:name@version)")
    .option("-k, --kind <kind>", "Artifact kind when installing by name (skills|prompt|agent)")
    .action(async (nameOrId: string, opts: { kind?: ArtifactKind }) => {
      // Create interactive path selector
      const selectInstallPath = async (
        options: AgentPlatformInfo[]
      ): Promise<string | null> => {
        if (options.length === 0) return null;

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        return new Promise((resolve) => {
          // eslint-disable-next-line no-console
          console.log("\nAvailable installation paths:");
          options.forEach((opt, idx) => {
            const type = opt.isProject ? "📁 Project" : "🌍 System";
            // eslint-disable-next-line no-console
            console.log(`${idx + 1}. [${type}] ${opt.platform}: ${opt.path}`);
          });
          // eslint-disable-next-line no-console
          console.log(`${options.length + 1}. Cancel (use default location)`);

          rl.question(
            `\nSelect installation path (1-${options.length + 1}): `,
            (answer: string) => {
              rl.close();
              const choice = parseInt(answer, 10);
              if (choice > 0 && choice <= options.length) {
                resolve(options[choice - 1]!.path);
              } else {
                resolve(null);
              }
            }
          );
        });
      };

      const ctx = await buildContext(selectInstallPath);
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
          fail(`Invalid artifact id: ${nameOrId}. Expected format: skills:name@version, prompt:name@version, or agent:name@version`);
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
  if (kind === "skills" || kind === "prompt" || kind === "agent") {
    return kind;
  }
  fail(`invalid kind: ${kind}. Expected one of: skills, prompt, agent`);
}


