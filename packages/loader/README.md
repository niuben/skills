# @skillos/loader

Artifact loader for directory, tarball, and buffer sources.

## What This Package Does

- Reads files into VFS entries (`FileEntry[]`)
- Auto-detects handler by file conventions
- Parses files into typed artifact manifest
- Supports loading from:
  - directory
  - `.tgz` tarball
  - tarball buffer
- Provides helper to create tarballs from source directory

## Main Exports

- `ArtifactLoader`
- `createTarballFromDir(dir, outFile)`

## Usage

```ts
import { ArtifactLoader } from "@skillos/loader";
import { registerBuiltinHandlers } from "@skillos/handlers";

registerBuiltinHandlers();

const loader = new ArtifactLoader();
const artifact = await loader.loadFromDir("./examples/my-skill");
console.log(artifact.type, artifact.name, artifact.version);
```
