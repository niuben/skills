import type { Artifact, FileEntry } from "./artifact/artifact.types.js";

export interface ArtifactHandler<T = unknown> {
  /** Unique artifact type handled by this plugin, e.g. "skill" */
  type: string;

  /**
   * Match if the input file set should be handled by this parser.
   */
  match(files: FileEntry[]): boolean;

  /**
   * Parse files into a typed manifest.
   */
  parse(files: FileEntry[]): T;

  /**
   * Optional explicit validation step for already parsed data.
   */
  validate?(manifest: unknown): T;

  /**
   * Optional runtime execution hook.
   */
  execute?(artifact: Artifact<T>, input?: unknown): Promise<unknown>;
}
