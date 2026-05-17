
**@taoai/skill-services — Package Overview**

- **Purpose**: Implement application business logic services (publish, install, search, sync, login, etc.). Provides reusable service classes that encapsulate specific operations.
- **Main files**: `src/publish/publishService.ts`, `src/install/installService.ts`, `src/search/searchService.ts`, `src/sync/syncService.ts`, `src/login/loginService.ts`.
- **Exports / API**: Service classes like `PublishService`, `SearchService`, `InstallService`, `SyncService`, `LoginService`. Services accept dependencies via constructor parameters (repository, storage, resolver, etc.).
- **Runtime notes**: These classes are mostly I/O agnostic; they delegate persistence to repository/storage implementations and are intended for reuse in both CLI and server runtimes.
- **Notes**: Designed as stateless classes for easier unit testing and reuse.
