# @skillsos/services

Application services that orchestrate repository, storage, and registry operations.

## Services

- `PublishService`: validate/create record, persist payload, save metadata
- `InstallService`: install by id from local storage or remote registry
- `SearchService`: query local repository
- `SyncService`: pull metadata/payload from remote registry into local cache

## Main Exports

- `PublishService`
- `InstallService`
- `SearchService`
- `SyncService`

## Notes

This package contains business workflow logic. It does not own transport (CLI/server) or persistence implementation details.
