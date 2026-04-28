import type { FileEntry } from "./artifact/artifact.types.js";
import type { ArtifactHandler } from "./handler.js";

export class HandlerRegistry {
  private readonly handlers = new Map<string, ArtifactHandler>();

  register(handler: ArtifactHandler): void {
    this.handlers.set(handler.type, handler);
  }

  get(type: string): ArtifactHandler {
    const handler = this.handlers.get(type);
    if (!handler) {
      throw new Error(`Handler not found for type: ${type}`);
    }
    return handler;
  }

  list(): string[] {
    return Array.from(this.handlers.keys());
  }

  all(): ArtifactHandler[] {
    return Array.from(this.handlers.values());
  }

  detect(files: FileEntry[]): ArtifactHandler {
    for (const handler of this.handlers.values()) {
      if (handler.match(files)) {
        return handler;
      }
    }
    throw new Error("No handler matched input files");
  }
}

export const handlerRegistry = new HandlerRegistry();
