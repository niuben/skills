import { handlerRegistry, type HandlerRegistry } from "@skillshub/core";
import { promptHandler } from "./promptHandler.js";
import { skillsHandler } from "./skillsHandler.js";
import { agentHandler } from "./agentHandler.js";

export function registerBuiltinHandlers(registry: HandlerRegistry = handlerRegistry): HandlerRegistry {
  registry.register(promptHandler);
  registry.register(skillsHandler);
  registry.register(agentHandler);
  return registry;
}
