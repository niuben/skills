import type { Command } from "commander";
import { buildContext, fail } from "../utils.js";

export function registerSyncCommand(program: Command): void {
  program
    .command("sync")
    .description("Sync artifacts from the configured remote registry")
    .action(async () => {
      const ctx = await buildContext();
      if (!ctx.syncService) fail("no remote registry configured");

      const report = await ctx.syncService.pullAll();
      // eslint-disable-next-line no-console
      console.log(`fetched ${report.fetched.length}, skipped ${report.skipped.length}, failed ${report.failed.length}`);
      for (const f of report.failed) {
        // eslint-disable-next-line no-console
        console.log(`  ! ${f.id}: ${f.error}`);
      }
    });
}
