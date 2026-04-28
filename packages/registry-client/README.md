# @skillos/registry-client

HTTP client for Skillos registry APIs.

## What This Package Does

- Health check (`ping`)
- Artifact search and listing
- Metadata lookup by id
- Artifact payload download
- Artifact publish via multipart form
- Version listing for a specific artifact name

## Main Exports

- `RegistryClient`
- Request/response types from `types.ts`

## Example

```ts
import { RegistryClient } from "@skillos/registry-client";

const client = new RegistryClient({ baseUrl: "http://localhost:3000" });
const result = await client.search({ kind: "skill", text: "translate" });
console.log(result.items.length);
```
