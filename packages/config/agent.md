
**@skillsos/config — Package Overview**

- **Purpose**: Provide application configuration loading and type definitions. Centralizes reading environment variables and config files and exposes a unified `loadConfig()`.
- **Main files**: `src/loadConfig.ts`, `src/config.ts`, `src/types.ts`.
- **Exports / API**: `loadConfig()`, configuration types (e.g. `Config`), and several path/constant helpers.
- **Runtime notes**: Call during application startup to obtain runtime configuration; other workspace packages import this package as a dependency.
- **Notes**: Uses TypeScript types to ensure consistent configuration fields and is intended for injection into server/CLI startup flows.
