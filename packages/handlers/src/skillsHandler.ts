import { z } from "zod";
import {
  type ArtifactHandler,
  matchSkillFiles,
  parseSkillMarkdownManifest,
} from "@skillshub/core";

const schema = z.object({
  name: z.string().min(1),
  version: z.string().min(1).optional(),
  description: z.string().min(1),
  rawMarkdown: z.string(),
  sections: z
    .object({
      role: z.string().optional(),
      input: z.string().optional(),
      output: z.string().optional(),
      prompt: z.string().optional(),
    })
    .strict(),
});

export const skillsHandler: ArtifactHandler = {
  type: "skills",

  match(files) {
    return matchSkillFiles(files);
  },

  parse(files) {
    return parseSkillMarkdownManifest(files);
  },

  validate(manifest) {
    return schema.parse(manifest);
  },

  async execute(artifact) {
    return artifact.manifest;
  },
};
