import { handlerRegistry, type HandlerRegistry } from "@skillos/core";
import { promptHandler } from "./promptHandler.js";
import { skillHandler } from "./skillHandler.js";
import { agentHandler } from "./agentHandler.js";

export function registerBuiltinHandlers(registry: HandlerRegistry = handlerRegistry): HandlerRegistry {
  registry.register(promptHandler);
  registry.register(skillHandler);
  registry.register(agentHandler);
  return registry;
}
