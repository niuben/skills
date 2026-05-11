
**apps/cli — Package Overview**

- **Purpose**: Command-line client providing subcommands like `install`, `publish`, `list`, `sync`, and `login` to manage artifacts.
- **Main files**: `src/index.ts` (entry), `src/commands/*` (command implementations), `src/utils.ts`.
- **Exports / API**: Executable CLI binary `skillos`. Commands are registered via `commander`.
- **Runtime notes**: CLI handles argument parsing, builds runtime context (loads config, instantiates storage/registry client), and invokes `services` APIs.
- **Notes**: For development run `pnpm --filter @skillshub/cli start` or `node ./dist/index.js` after build.
