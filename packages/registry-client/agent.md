
**@skillshub/registry-client — Package Overview**

- **Purpose**: HTTP client for interacting with remote registries for publishing, searching, and fetching artifacts.
- **Main files**: `src/registryClient.ts`, `src/index.ts`.
- **Exports / API**: `RegistryClient` (or equivalent) methods: `publish()`, `search()`, `get()`.
- **Runtime notes**: Handles network retries, pagination, auth headers, and rate-limit friendly behavior.
- **Notes**: Used by CLI `publish/sync` commands and server sync logic.
