
**@skillshub/storage — Package Overview**

- **Purpose**: Provide the local persistence layer (SQLite + file storage) and repository abstractions to manage artifact metadata and binary storage on disk.
- **Main files**: `src/db/sqlite.ts`, `src/db/schema.sql`, `src/repository/*`, `src/file/fileStorage.ts`, `src/file/pathResolver.ts`.
- **Exports / API**: Runtime factories such as `openDatabase()`, `createArtifactRepository()`, `createFileStorage()`, and `createPathResolver()`.
- **Runtime notes**: Handles DB migrations, schema initialization, and safe file path resolution. After build, ensure `.js` exports and ESM paths are correct for Node ESM runtime.
- **Notes**: Direct dependency of `services` and `server`. Schema changes require careful migration logic.
