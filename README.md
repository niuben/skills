# skillos

Enterprise-grade artifact management for **Skills**, **Prompts**, and **Agents**.

A pnpm monorepo with a clean **layered architecture**:

```
apps/      — entry points (CLI, registry server, future web UI)
packages/  — reusable building blocks
  core/           Domain models (Artifact / Skill / Prompt) — the most stable layer
  storage/        File + SQLite storage with a unified Repository facade
  services/       Business orchestration (publish, install, sync, search)
  registry-client/ HTTP client for talking to a remote registry
  config/         Configuration loading
  utils/          Shared helpers (logger, fs, hashing)
runtime/   — future per-host runtimes (node / browser)
plugins/   — future adapter extension points
storage/   — local data directory at runtime (artifacts, db, config)
```

## Quick start

```bash
# Install deps
pnpm install

# Start the local registry server
pnpm server

# In another terminal, publish an artifact
pnpm cli publish --manifest ./my-skill/manifest.json --payload ./my-skill.tgz

# List local artifacts
pnpm cli list

# Install an artifact by id
pnpm cli install skill:team/code-review@1.0.0

# Sync from the configured remote registry
pnpm cli sync
```

## Manifest example (`manifest.json`)

```json
{
  "kind": "skill",
  "name": "team/code-review",
  "version": "1.0.0",
  "description": "Reviews TypeScript pull requests",
  "tags": ["code", "review", "typescript"],
  "author": { "name": "Platform Team", "email": "platform@example.com" },
  "license": "Apache-2.0",
  "entry": "SKILL.md",
  "metadata": {
    "capabilities": ["code-review"],
    "runtime": "any"
  }
}
```

Supported `kind` values: `skill`, `prompt`, `agent`.

## Configuration

Default location: `~/.skillos/config.json` (override with `SKILLOS_HOME`).
Auto-created on first run with sensible defaults; edit to add registries:

```json
{
  "registries": [
    { "name": "default",  "url": "http://127.0.0.1:7421" },
    { "name": "internal", "url": "https://skillos.corp.local", "token": "..." }
  ],
  "defaultRegistry": "internal"
}
```

## HTTP API (server)

| Method | Path                                          | Description                  |
| ------ | --------------------------------------------- | ---------------------------- |
| GET    | `/healthz`                                    | Health check                 |
| GET    | `/api/artifacts?kind=&q=&limit=&offset=`      | List / search artifacts      |
| GET    | `/api/artifacts/:id`                          | Get artifact metadata        |
| GET    | `/api/artifacts/:id/download`                 | Download artifact payload    |
| GET    | `/api/artifacts/:kind/:name/versions`         | List all versions of a name  |
| POST   | `/api/artifacts`                              | Publish (multipart)          |

## Architecture notes

- **`packages/core`** has zero dependencies on storage or HTTP — it only defines
  domain types and validators (with `zod`). Everything else depends on it.
- **`packages/storage`** owns persistence; consumers interact through
  `ArtifactRepository` (the unified entry point).
- **`packages/services`** composes `core` + `storage` (+ optional
  `registry-client`) into use-cases. CLI and server depend only on services.
- **`apps/*`** are thin: they wire dependencies and expose them
  (CLI commands / HTTP routes).

## Requirements

- Node.js >= 18
- pnpm >= 9
