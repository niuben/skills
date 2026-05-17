# @taoai/skill-core

Core domain model and contracts for artifacts.

## What This Package Does

- Defines artifact types and ids
- Provides manifest validation schemas
- Provides artifact record factory for publish pipeline
- Provides convention-driven handler interfaces and registry
- Provides skill/prompt domain helpers

## Main Exports

- Artifact domain types from `artifact.types.ts`
- Id helpers from `artifact.ts`
- Validation helpers from `artifact.validator.ts`
- Record factory from `artifact.factory.ts`
- `ArtifactHandler` from `handler.ts`
- `HandlerRegistry` and `handlerRegistry` from `registry.ts`
- Skill schemas/parsers from `skill/*`

## Design

Core currently supports two flows:

- Legacy manifest-driven publish (`ArtifactManifest` + `ArtifactRecord`)
- Convention-driven parse flow (`match(files)` + `parse(files)`)

This keeps existing services stable while enabling markdown-first artifacts like `skills.md`.
