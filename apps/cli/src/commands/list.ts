import type { Command } from "commander";
import type { ArtifactKind } from "@skillos/core";
import { buildContext } from "../utils.js";

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("List local artifacts")
    .option("-k, --kind <kind>", "Filter by kind (skill|prompt|agent)")
    .option("-q, --query <text>", "Free-text search")
    .option("--limit <n>", "Max results", (v) => parseInt(v, 10), 50)
    .action(async (opts: { kind?: ArtifactKind; query?: string; limit: number }) => {
      const ctx = await buildContext();
      const items = ctx.searchService.list({
        kind: opts.kind,
        text: opts.query,
        limit: opts.limit,
      });

      if (items.length === 0) {
        // eslint-disable-next-line no-console
        console.log("(no artifacts)");
        return;
      }

      for (const a of items) {
        // eslint-disable-next-line no-console
        console.log(`${a.id.padEnd(48)}  ${a.size.toString().padStart(8)}B  ${a.publishedAt}`);
      }
    });
}
