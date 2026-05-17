
**@taoai/skill-core — Package Overview**

- **Purpose**: Core domain models and utilities. Defines types, factories, and validation logic for artifacts, prompts, and skills.
- **Main files**: `src/artifact/*` (types, factory, validator), `src/prompt/prompt.ts`, `src/registry.ts`.
- **Exports / API**: Types like `Artifact` / `ArtifactManifest`, factory helpers, and validation functions (Zod-based).
- **Runtime notes**: Pure logic and types only; used by `services`, `loader`, and `registry-client` packages. No external side effects.
- **Notes**: Maintain backward compatibility carefully — type changes can affect multiple services.
