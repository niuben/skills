import { z } from "zod";
import type { ArtifactHandler, FileEntry } from "@skillshub/core";

const schema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  description: z.string().optional(),
  model: z.string().min(1),
  systemPrompt: z.string().min(1),
  tools: z.array(z.string()).optional(),
});

function findAgentFile(files: FileEntry[]): FileEntry | undefined {
  return files.find((f) => /(^|\/)agent\.(yaml|yml|json)$/i.test(f.path));
}

function parseSimpleYaml(raw: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const i = trimmed.indexOf(":");
    if (i <= 0) continue;

    const key = trimmed.slice(0, i).trim();
    let value: unknown = trimmed.slice(i + 1).trim();

    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
    }

    if (typeof value === "string") {
      value = value.replace(/^['\"]|['\"]$/g, "");
    }

    out[key] = value;
  }

  return out;
}

export const agentHandler: ArtifactHandler = {
  type: "agent",

  match(files) {
    return Boolean(findAgentFile(files));
  },

  parse(files) {
    const file = findAgentFile(files);
    if (!file) throw new Error("agent.yaml/yml/json not found");

    const raw = file.content.toString("utf8");
    if (/\.json$/i.test(file.path)) {
      return JSON.parse(raw);
    }
    return parseSimpleYaml(raw);
  },

  validate(manifest) {
    return schema.parse(manifest);
  },

  async execute(artifact, input) {
    const m = artifact.manifest as { model: string };
    return { message: `Agent using ${m.model}`, input };
  },
};
