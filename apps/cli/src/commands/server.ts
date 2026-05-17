import type { Command } from "commander";
import { startServer, stopServer, restartServer } from '@taoai/skill-server';

export function registerServerCommand(program: Command): void {
  program
    .command('server')
    .description('Manage the local server')
    .argument('<action>', 'Action to perform (start|stop|restart)')
    .action(async (action: string) => {
      switch (action) {
        case 'start':
          await startServer();
          break;
        case 'stop':
          await stopServer();
          break;
        case 'restart':
          await restartServer();
          break;
        default:
          // eslint-disable-next-line no-console
          console.log('Invalid action. Use start, stop, or restart.');
      }
    });
}