import { z } from "zod";
import { ArtifactManifestSchema } from "../artifact/artifact.validator.js";
import type { ArtifactRecord } from "../artifact/artifact.types.js";

export const PromptManifestSchema = ArtifactManifestSchema.extend({
  kind: z.literal("prompt"),
  metadata: z
    .object({
      model: z.string().optional(),
      variables: z.array(z.string()).optional(),
    })
    .passthrough()
    .optional(),
});

export type PromptManifest = z.infer<typeof PromptManifestSchema>;

export interface PromptRecord extends ArtifactRecord {
  kind: "prompt";
}

export function isPromptRecord(a: ArtifactRecord): a is PromptRecord {
  return a.kind === "prompt";
}

export function parsePromptManifest(input: unknown): PromptManifest {
  return PromptManifestSchema.parse(input);
}
