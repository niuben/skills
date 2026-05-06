
**@skillsos/handlers — Package Overview**

- **Purpose**: Provide high-level event/request handlers (e.g., `agentHandler`, `promptHandler`) that integrate `core` with runtime environments.
- **Main files**: `src/agentHandler.ts`, `src/promptHandler.ts`, `src/bootstrap.ts`.
- **Exports / API**: Handler functions for different runtimes; used to register or bind behavior at startup.
- **Runtime notes**: Glue code that interacts with external events (CLI, HTTP, messaging) and routes them into core logic.
- **Notes**: Invoked primarily during CLI/server bootstrap.
