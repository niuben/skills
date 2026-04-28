import { z } from "zod";

export const ArtifactKindSchema = z.enum(["skill", "prompt", "agent"]);

export const ArtifactAuthorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
});

const SEMVER_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const NAME_RE = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)?$/;

export const ArtifactManifestSchema = z.object({
  kind: ArtifactKindSchema,
  name: z.string().regex(NAME_RE, "name must match /^[a-z0-9][a-z0-9._-]*(\\/[a-z0-9][a-z0-9._-]*)?$/"),
  version: z.string().regex(SEMVER_RE, "version must be valid semver"),
  description: z.string().max(500).optional(),
  readme: z.string().optional(),
  tags: z.array(z.string().min(1)).optional(),
  author: ArtifactAuthorSchema.optional(),
  license: z.string().optional(),
  entry: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type ParsedManifest = z.infer<typeof ArtifactManifestSchema>;

export function validateManifest(input: unknown): ParsedManifest {
  return ArtifactManifestSchema.parse(input);
}

export function safeValidateManifest(input: unknown):
  | { ok: true; manifest: ParsedManifest }
  | { ok: false; errors: string[] } {
  const result = ArtifactManifestSchema.safeParse(input);
  if (result.success) return { ok: true, manifest: result.data };
  return {
    ok: false,
    errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}
