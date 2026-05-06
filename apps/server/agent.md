
**apps/server — Package Overview**

- **Purpose**: Provide an HTTP API (Fastify-based) exposing publish/search/sync and other service endpoints.
- **Main files**: `src/app.ts` (app builder), `src/routes/*` (routes), `src/controllers/*` (controllers, if present).
- **Exports / API**: `buildApp()` to programmatically assemble services and `index.ts` as the runtime entry.
- **Runtime notes**: Responsible for route registration, dependency injection (services, storage, repository), multipart file uploads, and DB initialization.
- **Notes**: Routes are registered as Fastify plugins. For production, pay attention to port binding and security configuration.
