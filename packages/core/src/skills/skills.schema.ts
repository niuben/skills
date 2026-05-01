import { z } from "zod";
import { ArtifactManifestSchema } from "../artifact/artifact.validator.js";

/**
 * Legacy schema used by existing publish APIs.
 */
export const SkillManifestSchema = ArtifactManifestSchema.extend({
  kind: z.literal("skills"),
  metadata: z.record(z.unknown()).optional(),
});

/**
 * Convention-driven schema parsed from skills.md + frontmatter.
 */
export const SkillSectionsSchema = z.object({
  role: z.string().optional(),
  input: z.string().optional(),
  output: z.string().optional(),
  prompt: z.string().optional(),
});

export const SkillMarkdownManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1).optional(),
  description: z.string().min(1),
  rawMarkdown: z.string(),
  sections: SkillSectionsSchema,
});

export type SkillManifest = z.infer<typeof SkillManifestSchema>;
export type SkillMarkdownManifest = z.infer<typeof SkillMarkdownManifestSchema>;
