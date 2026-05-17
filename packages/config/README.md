# @taoai/skill-config

Configuration loading and persistence for Skillos.

## What This Package Does

- Defines config types and defaults
- Creates default config file on first run
- Loads user config and merges it with defaults
- Saves updated config back to disk

## Main Exports

- `loadConfig(opts?)`
- `saveConfig(cfg, configFile?)`
- `getDefaultConfig(dataDir)`
- `getDefaultDataDir()`
- Config types from `types.ts`

## Notes

`loadConfig` creates the config file when it does not exist, so CLI/server startup can rely on a valid config object.

## Example

```ts
import { loadConfig } from "@taoai/skill-config";

const cfg = await loadConfig();
console.log(cfg.defaultRegistry);
```
