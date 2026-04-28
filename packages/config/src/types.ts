export interface RegistryConfig {
  /** Registry name (e.g. "default", "internal") */
  name: string;
  /** Registry URL (https://registry.example.com) */
  url: string;
  /** Optional auth token */
  token?: string;
}

export interface StorageConfig {
  /** Root directory for artifact files */
  artifactsDir: string;
  /** SQLite database file path */
  dbFile: string;
}

export interface ServerConfig {
  host: string;
  port: number;
}

export interface SkillosConfig {
  /** Root data directory */
  dataDir: string;
  storage: StorageConfig;
  server: ServerConfig;
  registries: RegistryConfig[];
  defaultRegistry?: string;
}

export type PartialConfig = Partial<
  Omit<SkillosConfig, "storage" | "server"> & {
    storage?: Partial<StorageConfig>;
    server?: Partial<ServerConfig>;
  }
>;
