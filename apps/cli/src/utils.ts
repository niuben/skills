import path from "node:path";
import { loadConfig, type SkillosConfig } from "@skillos/config";
import {
  createArtifactRepository,
  createFileStorage,
  createPathResolver,
  openDatabase,
  type ArtifactRepository,
  type FileStorage,
  type PathResolver,
} from "@skillos/storage";
import { RegistryClient } from "@skillos/registry-client";
import {
  InstallService,
  PublishService,
  SearchService,
  SyncService,
} from "@skillos/services";

export interface CliContext {
  config: SkillosConfig;
  repository: ArtifactRepository;
  storage: FileStorage;
  resolver: PathResolver;
  registry?: RegistryClient;
  publishService: PublishService;
  installService: InstallService;
  searchService: SearchService;
  syncService?: SyncService;
}

export async function buildContext(): Promise<CliContext> {
  const config = await loadConfig();
  const db = await openDatabase({ file: config.storage.dbFile });
  const repository = createArtifactRepository(db);
  const resolver = createPathResolver(config.storage.artifactsDir);
  const storage = createFileStorage(resolver);

  const defaultReg = config.registries.find((r) => r.name === config.defaultRegistry);
  const registry = defaultReg
    ? new RegistryClient({ baseUrl: defaultReg.url, token: defaultReg.token })
    : undefined;

  const publishService = new PublishService({ repository, storage, resolver });
  const installService = new InstallService({
    repository,
    storage,
    registry,
    installRoot: path.join(config.dataDir, "installed"),
  });
  const searchService = new SearchService({ repository });
  const syncService = registry ? new SyncService({ repository, storage, registry }) : undefined;

  return {
    config,
    repository,
    storage,
    resolver,
    registry,
    publishService,
    installService,
    searchService,
    syncService,
  };
}

export function fail(msg: string, code = 1): never {
  // eslint-disable-next-line no-console
  console.error(`error: ${msg}`);
  process.exit(code);
}
