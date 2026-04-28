# @skillos/handlers

Built-in artifact handlers for convention-driven parsing.

## Included Handlers

- `skillHandler`: detects and parses `skills.md`
- `promptHandler`: detects and parses `prompt.md`
- `agentHandler`: detects and parses `agent.yaml|agent.yml|agent.json`

## Bootstrap

Use `registerBuiltinHandlers` to register all built-in handlers into a registry.

```ts
import { registerBuiltinHandlers } from "@skillos/handlers";

registerBuiltinHandlers();
```

## Main Exports

- `promptHandler`
- `skillHandler`
- `agentHandler`
- `registerBuiltinHandlers`

## Notes

Handlers are intentionally simple and safe defaults for local development. You can register your own handlers with the same interface from `@skillos/core`.
