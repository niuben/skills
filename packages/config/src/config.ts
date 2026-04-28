import path from "node:path";
import os from "node:os";
import type { SkillosConfig } from "./types.js";

export function getDefaultDataDir(): string {
  if (process.env.SKILLOS_HOME) return process.env.SKILLOS_HOME;
  return path.join(os.homedir(), ".skillos");
}

export function getDefaultConfig(dataDir = getDefaultDataDir()): SkillosConfig {
  return {
    dataDir,
    storage: {
      artifactsDir: path.join(dataDir, "artifacts"),
      dbFile: path.join(dataDir, "db.sqlite"),
    },
    server: {
      host: "127.0.0.1",
      port: 7421,
    },
    registries: [
      {
        name: "default",
        url: "http://127.0.0.1:7421",
      },
    ],
    defaultRegistry: "default",
  };
}

export const CONFIG_FILE_NAME = "config.json";
