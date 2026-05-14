import { loadConfig } from "@skillshub/config";
import { createLogger } from "@skillshub/utils";
import { buildApp } from "./app.js";

const MAX_PORT_RETRIES = 20;

async function listenWithFallback(
  app: Awaited<ReturnType<typeof buildApp>>["app"],
  host: string,
  preferredPort: number,
  log: ReturnType<typeof createLogger>
): Promise<number> {
  for (let attempt = 0; attempt <= MAX_PORT_RETRIES; attempt += 1) {
    const port = preferredPort + attempt;
    try {
      await app.listen({ host, port });
      if (attempt > 0) {
        log.warn(`port ${preferredPort} is in use, switched to ${port}`);
      }
      return port;
    } catch (err) {
      const maybeCode = (err as { code?: string }).code;
      if (maybeCode === "EADDRINUSE" && attempt < MAX_PORT_RETRIES) {
        continue;
      }
      throw err;
    }
  }

  throw new Error(`no available port found from ${preferredPort} to ${preferredPort + MAX_PORT_RETRIES}`);
}

async function main(): Promise<void> {
  const log = createLogger("server");
  const config = await loadConfig();
  const { app } = await buildApp();

  try {
    const port = await listenWithFallback(app, config.server.host, config.server.port, log);
    log.info(`listening on http://${config.server.host}:${port}`);
  } catch (err) {
    log.error(`failed to start: ${(err as Error).message}`);
    process.exit(1);
  }
}

main();
