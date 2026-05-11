import { loadConfig } from "@skillshub/config";
import { createLogger } from "@skillshub/utils";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const log = createLogger("server");
  const config = await loadConfig();
  const { app } = await buildApp();

  try {
    await app.listen({ host: config.server.host, port: config.server.port });
    log.info(`listening on http://${config.server.host}:${config.server.port}`);
  } catch (err) {
    log.error(`failed to start: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
