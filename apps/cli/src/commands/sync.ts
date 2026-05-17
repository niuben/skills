import type { Command } from "commander";
import { buildContext, fail } from "../utils.js";

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4 || 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function resolveUsernameFromRegistry(registry: { username?: string; token?: string } | undefined): string | null {
  if (!registry) return null;
  if (registry.username) return registry.username;
  if (!registry.token) return null;

  const payload = decodeJwtPayload(registry.token);
  const username = payload && typeof payload.username === "string" ? payload.username : null;
  return username;
}

export function registerSyncCommand(program: Command): void {
  program
    .command("sync")
    .description("Sync all skills published by the current logged-in user")
    .option("-u, --username <username>", "Username whose skills should be synced")
    .option("-o, --output <dir>", "Output directory (default: local cache directory)")
    .action(async (opts: { username?: string; output?: string }) => {
      const ctx = await buildContext();
      if (!ctx.syncService) fail("no remote registry configured");
      const registry = ctx.config.registries.find((r) => r.name === ctx.config.defaultRegistry) ?? ctx.config.registries[0];
      const username = opts.username ?? resolveUsernameFromRegistry(registry);
      if (!username) fail("missing login username in config; run 'skillos login' first");

      const outputDir = opts.output || process.cwd();
      const report = await ctx.syncService.pullUserSkillsTo(username, outputDir);
      // eslint-disable-next-line no-console
      console.log(
        `synced skills for ${username}: fetched ${report.fetched.length}, skipped ${report.skipped.length}, unavailable ${report.unavailable.length}, failed ${report.failed.length}`
      );
      if (report.skipped.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`skipped means already present under: ${outputDir}`);
      }
      if (report.fetched.length > 0) {
        // eslint-disable-next-line no-console
        console.log(`new payloads saved under: ${outputDir}`);
      }
      // eslint-disable-next-line no-console
      if (!opts.output) {
        console.log(`tip: payloads downloaded to current directory: ${outputDir}`);
        // eslint-disable-next-line no-console
        console.log(`use 'skillos install --source ${outputDir}/<kind>/<artifact-id>/<version>.tgz' to unpack and use code`);
      } else {
        // eslint-disable-next-line no-console
        console.log(`tip: use 'skillos install --source ${outputDir}/<kind>/<artifact-id>/<version>.tgz' to unpack from this directory`);
      }
      for (const u of report.unavailable) {
        // eslint-disable-next-line no-console
        console.log(`  - ${u.id}: ${u.reason}`);
      }
      for (const f of report.failed) {
        // eslint-disable-next-line no-console
        console.log(`  ! ${f.id}: ${f.error}`);
      }
    });
}
