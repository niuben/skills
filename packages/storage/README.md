# @skillshub/storage

Persistence adapters for files and metadata.

## What This Package Does

- File storage abstraction and implementation
- Artifact path resolver
- SQLite database bootstrap
- Artifact repository CRUD/query methods

## Main Exports

- `createFileStorage`
- `createPathResolver`
- `openDatabase`
- `createArtifactRepository`
- Storage/repository interfaces

## Database

SQLite schema is defined in `src/db/schema.sql` and copied to `dist/db/schema.sql` during build.

## Notes

`PathResolver` keeps storage path generation consistent across publish/install/sync flows.
