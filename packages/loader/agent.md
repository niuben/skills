
**@taoai/skill-loader — Package Overview**

- **Purpose**: Load artifacts from disk or remote sources and produce normalized artifact objects (artifact loader). Responsible for manifest parsing and filesystem interaction.
- **Main files**: `src/artifactLoader.ts`, `src/index.ts`.
- **Exports / API**: Loader functions such as `loadArtifactFromPath()` and adapters.
- **Runtime notes**: Reads local directories, parses manifests, and returns standardized objects for `services` to consume.
- **Notes**: Focus on I/O error handling and manifest validation (reuses core validators).
