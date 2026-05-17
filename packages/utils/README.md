# @taoai/skill-utils

Shared low-level helpers used across the monorepo.

## What This Package Does

- Structured logger (`createLogger`)
- Filesystem helpers (`ensureDir`, `pathExists`, `readJson`, `writeJson`, etc.)
- Hash helper (`sha256Buffer`)

## Main Exports

- Logger utilities from `logger.ts`
- Filesystem/hash helpers from `fs.ts`

## Example

```ts
import { createLogger, sha256Buffer } from "@taoai/skill-utils";

const log = createLogger("example");
log.info("ready");

const digest = sha256Buffer(Buffer.from("hello"));
console.log(digest);
```
