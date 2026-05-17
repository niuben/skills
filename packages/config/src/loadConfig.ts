import path from "node:path";
import { ensureDir, pathExists, readJson, writeJson } from "@taoai/skill-utils";
import { CONFIG_FILE_NAME, getDefaultConfig, getDefaultDataDir } from "./config.js";
import type { PartialConfig, SkillosConfig } from "./types.js";

function mergeConfig(base: SkillosConfig, override: PartialConfig): SkillosConfig {
  return {
    ...base,
    ...override,
    storage: { ...base.storage, ...(override.storage ?? {}) },
    server: { ...base.server, ...(override.server ?? {}) },
    registries: override.registries ?? base.registries,
    defaultRegistry: override.defaultRegistry ?? base.defaultRegistry,
  };
}

export interface LoadConfigOptions {
  dataDir?: string;
  configFile?: string;
}

export async function loadConfig(opts: LoadConfigOptions = {}): Promise<SkillosConfig> {
  const dataDir = opts.dataDir ?? getDefaultDataDir();
  await ensureDir(dataDir);
  const file = opts.configFile ?? path.join(dataDir, CONFIG_FILE_NAME);

  const defaults = getDefaultConfig(dataDir);

  if (!(await pathExists(file))) {
    await writeJson(file, defaults);
    return defaults;
  }

  const userCfg = await readJson<PartialConfig>(file);
  return mergeConfig(defaults, userCfg);
}

export async function saveConfig(cfg: SkillosConfig, configFile?: string): Promise<void> {
  const file = configFile ?? path.join(cfg.dataDir, CONFIG_FILE_NAME);
  await writeJson(file, cfg);
}
