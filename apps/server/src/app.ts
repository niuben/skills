import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { loadConfig } from "@skillsos/config";
import {
  createArtifactRepository,
  createFileStorage,
  createPathResolver,
  SettingsRepository,
  openDatabase,
  UserRepository,
} from "@skillsos/storage";
import { LoginService, PublishService, SearchService } from "@skillsos/services";
import { createLogger } from "@skillsos/utils";
import { registerArtifactRoutes } from "./routes/artifact.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerAuthRoutes } from "./routes/auth.js";

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
  const userRepository = new UserRepository(db);
  const settingsRepository = new SettingsRepository(db);
  const resolver = createPathResolver(config.storage.artifactsDir);
  const storage = createFileStorage(resolver);

  const publishService = new PublishService({
    repository,
    storage,
    resolver,
    getDefaultApprovalStatus: () => (settingsRepository.getSettings().requireApproval ? "pending" : "approved"),
  });
  const searchService = new SearchService({ repository });
  const loginService = new LoginService(userRepository);
  ensureDefaultAdmin(userRepository, loginService, log);
  const jwtSecret = process.env.SKILLOS_JWT_SECRET ?? "skillos-dev-secret";
  if (!process.env.SKILLOS_JWT_SECRET) {
    log.warn("SKILLOS_JWT_SECRET is not set; using development JWT secret");
  }

  const app = Fastify({ logger: false });
  await app.register(multipart, { limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB


  app.get("/healthz", async () => ({ ok: true }));
  registerArtifactRoutes(app, { publishService, searchService, storage, repository });
  registerAuthRoutes(app, { loginService, jwtSecret });
  registerAdminRoutes(app, {
    repository,
    userRepository,
    settingsRepository,
    jwtSecret,
    dataDir: config.dataDir,
  });

  log.info(`server initialized (data dir: ${config.dataDir})`);
  return { app, publishService, searchService, storage, repository };
}

function ensureDefaultAdmin(
  userRepository: UserRepository,
  loginService: LoginService,
  log: ReturnType<typeof createLogger>
): void {
  if (userRepository.hasUsers()) return;
  const username = process.env.SKILLOS_ADMIN_USERNAME ?? "admin";
  const password = process.env.SKILLOS_ADMIN_PASSWORD ?? "admin123";
  loginService.register(username, password, "admin");
  log.warn(`created default admin user '${username}'; configure SKILLOS_ADMIN_USERNAME/SKILLOS_ADMIN_PASSWORD for production`);
}
