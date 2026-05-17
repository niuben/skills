
**Skills Hub Repository — Overview**

- **Purpose**: A reusable artifacts/skills management platform including a CLI, HTTP service, and frontend console, organized as a modular monorepo.
- **Packages**: `packages/config`, `packages/core`, `packages/storage`, `packages/services`, `packages/loader`, `packages/registry-client`, `packages/utils`, `packages/handlers`. Application layer: `apps/cli`, `apps/server`, `apps/web`.
- **How to run**: Root scripts include `pnpm run build` and `pnpm run dev` to build or run packages in parallel. `apps/server` is the Fastify API, `apps/web` is the React frontend, and `apps/cli` is the command-line tool.
- **Design principles**: Dependency injection, stateless service classes in `packages/services`, pluggable persistence (`@taoai/skill-storage`), and clear type boundaries in `@taoai/skill-core`.
- **Notes**: Evaluate backward compatibility when changing schemas, core types, or service interfaces. Built ESM exports must preserve `.js` extensions for Node ESM runtime.
