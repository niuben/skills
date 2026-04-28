import type { Command } from "commander";
import { buildContext, fail } from "../utils.js";

export function registerInstallCommand(program: Command): void {
  program
    .command("install <id>")
    .description("Install an artifact by id (kind:name@version)")
    .action(async (id: string) => {
      const ctx = await buildContext();
      let result;
      try {
        result = await ctx.installService.installById(id);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes("Invalid artifact id")) {
          fail(`Invalid artifact id: ${id}. Expected format: skill:name@version, prompt:name@version, or agent:name@version`);
        }
        throw err;
      }
      // eslint-disable-next-line no-console
      console.log(`installed ${result.record.id}`);
      // eslint-disable-next-line no-console
      console.log(`  -> ${result.installPath}`);
    });
}
