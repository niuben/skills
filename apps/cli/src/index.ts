#!/usr/bin/env node
import { Command } from "commander";
import { registerSyncCommand } from "./commands/sync.js";
import { registerInstallCommand } from "./commands/install.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerListCommand } from "./commands/list.js";
import { registerServerCommand } from "./commands/server.js";
import { registerLoginCommand } from "./commands/login.js";

const program = new Command();

program
  .name("skill")
  .description("Enterprise skills/prompts/agents artifact manager")
  .version("0.1.0");

registerInstallCommand(program);
registerPublishCommand(program);
registerListCommand(program);
registerSyncCommand(program);
registerServerCommand(program);
registerLoginCommand(program);

program.parseAsync(process.argv).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
