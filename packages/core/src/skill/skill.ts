import type { ArtifactRecord, FileEntry } from "../artifact/artifact.types.js";
import {
  SkillManifestSchema,
  SkillMarkdownManifestSchema,
  type SkillManifest,
  type SkillMarkdownManifest,
} from "./skill.schema.js";

export interface SkillRecord extends ArtifactRecord {
  kind: "skill";
}

export function isSkillRecord(a: ArtifactRecord): a is SkillRecord {
  return a.kind === "skill";
}

export function parseSkillManifest(input: unknown): SkillManifest {
  return SkillManifestSchema.parse(input);
}

export function matchSkillFiles(files: FileEntry[]): boolean {
  return files.some((f) => isSkillMarkdownPath(f.path));
}

export function parseSkillMarkdownManifest(files: FileEntry[]): SkillMarkdownManifest {
  const skillFile = files.find((f) => isSkillMarkdownPath(f.path));
  if (!skillFile) {
    throw new Error("skills.md not found");
  }

  const parsed = parseFrontmatter(skillFile.content.toString("utf8"));
  const sections = extractSections(parsed.body);
  return SkillMarkdownManifestSchema.parse({
    name: parsed.frontmatter.name,
    version: parsed.frontmatter.version,
    description: parsed.frontmatter.description,
    rawMarkdown: parsed.body,
    sections,
  });
}

function isSkillMarkdownPath(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();
  return normalized.endsWith("skills.md") || normalized.endsWith("skill.md");
}

function parseFrontmatter(input: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const normalized = input.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    throw new Error("skills.md frontmatter is required and must start with ---");
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    throw new Error("skills.md frontmatter closing --- is missing");
  }

  const rawFrontmatter = normalized.slice(4, end);
  const body = normalized.slice(end + "\n---\n".length).trim();
  const frontmatter = parseSimpleYaml(rawFrontmatter);

  return { frontmatter, body };
}

function parseSimpleYaml(raw: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx <= 0) continue;

    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, "");
    out[key] = value;
  }

  return out;
}

function extractSections(markdown: string): {
  role?: string;
  input?: string;
  output?: string;
  prompt?: string;
} {
  const lines = markdown.split("\n");
  const sections: Record<string, string[]> = {};
  let current: string | undefined;

  for (const line of lines) {
    const titleMatch = /^#{1,6}\s+(.+)$/.exec(line.trim());
    if (titleMatch) {
      const key = titleMatch[1].trim().toLowerCase();
      if (key === "role" || key === "input" || key === "output" || key === "prompt") {
        current = key;
        sections[current] = [];
      } else {
        current = undefined;
      }
      continue;
    }

    if (current) {
      sections[current].push(line);
    }
  }

  return {
    role: sections.role?.join("\n").trim() || undefined,
    input: sections.input?.join("\n").trim() || undefined,
    output: sections.output?.join("\n").trim() || undefined,
    prompt: sections.prompt?.join("\n").trim() || undefined,
  };
}
