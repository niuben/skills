import { z } from "zod";
import type { ArtifactHandler, FileEntry } from "@skillshub/core";

const schema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  template: z.string().min(1),
  variables: z.array(z.string()).optional(),
});

function findPromptFile(files: FileEntry[]): FileEntry | undefined {
  return files.find((f) => /(^|\/)prompt\.md$/i.test(f.path));
}

function parseFrontmatter(input: string): { data: Record<string, string>; body: string } {
  const normalized = input.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { data: {}, body: normalized.trim() };
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) {
    throw new Error("prompt.md has opening frontmatter but no closing ---");
  }

  const raw = normalized.slice(4, end);
  const body = normalized.slice(end + 5).trim();
  const data: Record<string, string> = {};

  for (const line of raw.split("\n")) {
    const i = line.indexOf(":");
    if (i <= 0) continue;
    data[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^['\"]|['\"]$/g, "");
  }

  return { data, body };
}

export const promptHandler: ArtifactHandler = {
  type: "prompt",

  match(files) {
    return Boolean(findPromptFile(files));
  },

  parse(files) {
    const file = findPromptFile(files);
    if (!file) {
      throw new Error("prompt.md not found");
    }

    const { data, body } = parseFrontmatter(file.content.toString("utf8"));
    const variables = [...body.matchAll(/{{\s*([a-zA-Z0-9_]+)\s*}}/g)].map((m) => m[1]);

    return {
      name: data.name ?? file.path.replace(/(^|\/)prompt\.md$/i, "prompt").replace(/\//g, "-"),
      version: data.version ?? "0.1.0",
      description: data.description,
      template: body,
      variables: variables.length ? Array.from(new Set(variables)) : undefined,
    };
  },

  validate(manifest) {
    return schema.parse(manifest);
  },

  async execute(artifact, input) {
    let output = String((artifact.manifest as { template: string }).template);
    const values = (input ?? {}) as Record<string, string>;

    for (const [key, value] of Object.entries(values)) {
      output = output.replaceAll(`{{${key}}}`, String(value));
    }

    return output;
  },
};
