#!/usr/bin/env node
import { registerSyncCommand } from "./commands/sync.js";
import { Command } from "commander";

import { registerInstallCommand } from "./commands/install.js";
import { registerPublishCommand } from "./commands/publish.js";
import { registerListCommand } from "./commands/list.js";

const program = new Command();

import { loginCommand } from './commands/login.js';
program
  .command('login')
  .description('Login to Skills Hub server')
  .action(loginCommand);

program
  .name("skillos")
  .description("Enterprise skills/prompts/agents artifact manager")
  .version("0.1.0");

registerInstallCommand(program);
registerPublishCommand(program);
registerListCommand(program);
registerSyncCommand(program);

program.parseAsync(process.argv).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
