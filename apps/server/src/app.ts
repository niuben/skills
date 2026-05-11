import Fastify, { type FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import { loadConfig } from "@skillshub/config";
import {
  createArtifactRepository,
  createFileStorage,
  createPathResolver,
  SettingsRepository,
  openDatabase,
  UserRepository,
} from "@skillshub/storage";
import { LoginService, PublishService, SearchService } from "@skillshub/services";
import { createLogger } from "@skillshub/utils";
import { registerArtifactRoutes } from "./routes/artifact.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { registerAuthRoutes } from "./routes/auth.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fastifyStatic from "@fastify/static";

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

  // theme endpoints (CSS variables + JSON)
  const { registerThemeRoutes } = await import("./routes/theme.js");
  registerThemeRoutes(app, settingsRepository);

  log.info(`server initialized (data dir: ${config.dataDir})`);

  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const workspaceRoot = path.resolve(currentDir, "../../..");

  // Serve built static assets for web and admin (production)
  const webDist = path.join(workspaceRoot, "apps/web/dist");
  const adminDist = path.join(workspaceRoot, "apps/admin/dist");
  const webIndex = path.join(webDist, "index.html");
  const adminIndex = path.join(adminDist, "index.html");

  // Register admin static first (prefixed)
  await app.register(fastifyStatic, {
    root: adminDist,
    prefix: "/admin/",
    wildcard: false,
  });

  // Register web static for root
  await app.register(fastifyStatic, {
    root: webDist,
    prefix: "/",
    wildcard: false,
    decorateReply: false,
  });

  // SPA fallbacks that inline critical CSS variables to avoid FOUC
  app.get("/admin/*", async (req, reply) => {
    try {
      let html = await fs.readFile(adminIndex, "utf8");
      const css = `:root{--accent:${settingsRepository.getSettings().primaryColor};}`;
      html = html.replace("</head>", `<style>${css}</style></head>`);
      reply.type("text/html").send(html);
    } catch {
      reply.code(500).send("admin index not available");
    }
  });

  app.get("/*", async (req, reply) => {
    try {
      let html = await fs.readFile(webIndex, "utf8");
      const css = `:root{--accent:${settingsRepository.getSettings().primaryColor};}`;
      html = html.replace("</head>", `<style>${css}</style></head>`);
      reply.type("text/html").send(html);
    } catch (err) {
      console.log("error serving web index.html:", err);
      reply.code(500).send("web index not available");
    }
  });

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
