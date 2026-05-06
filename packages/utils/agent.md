
**@skillsos/utils — Package Overview**

- **Purpose**: Provide common utility functions (filesystem helpers, logging, small helpers) shared across packages in the repository.
- **Main files**: `src/fs.ts`, `src/logger.ts`, `src/index.ts`.
- **Exports / API**: Small helpers like `ensureDir()`, `createLogger()`, etc.
- **Runtime notes**: Pure utility library; prefer backward compatibility. Logger configuration is consumed by server/cli.
- **Notes**: No external runtime dependencies; easy to mock or replace in unit tests.
