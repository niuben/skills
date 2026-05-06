import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { loadConfig } from "@skillsos/config";
import {
  createArtifactRepository,
  createFileStorage,
  createPathResolver,
  openDatabase,
} from "@skillsos/storage";
import { PublishService, SearchService } from "@skillsos/services";
import { createLogger } from "@skillsos/utils";
import { registerArtifactRoutes } from "./routes/artifact.js";
import loginRoutes from './routes/login.js';

export interface AppDeps {
  app: FastifyInstance;
  publishService: PublishService;
  searchService: SearchService;
  storage: ReturnType<typeof createFileStorage>;
  repository: ReturnType<typeof createArtifactRepository>;
}

export async function buildApp(): Promise<AppDeps> {
  const log = createLogger("server");
  const config = await loadConfig();

  const db = await openDatabase({ file: config.storage.dbFile });
  const repository = createArtifactRepository(db);
  const resolver = createPathResolver(config.storage.artifactsDir);
  const storage = createFileStorage(resolver);

  const publishService = new PublishService({ repository, storage, resolver });
  const searchService = new SearchService({ repository });

  const app = Fastify({ logger: false });
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB


  app.get("/healthz", async () => ({ ok: true }));
  registerArtifactRoutes(app, { publishService, searchService, storage, repository });
  await app.register(loginRoutes, { prefix: '/login' });

  log.info(`server initialized (data dir: ${config.dataDir})`);
  return { app, publishService, searchService, storage, repository };
}
