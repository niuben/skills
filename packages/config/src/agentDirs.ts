/**
 * Agent Platform Directory Configuration
 * Defines where skills should be installed for various AI agent platforms
 */

export interface AgentDirConfig {
  name: string;
  skills: {
    system: string[];
    project: string[];
  };
}

export const AGENT_DIR_CONFIG: AgentDirConfig[] = [
  {
    name: "AMP",
    skills: {
      system: ["~/.config/agents/skills/"],
      project: [".agents/skills/"],
    },
  },
  {
    name: "Antigravity",
    skills: {
      system: ["~/.gemini/antigravity/skills/"],
      project: [".agents/skills/"],
    },
  },
  {
    name: "Claude Code",
    skills: {
      system: ["~/.claude/skills/"],
      project: [".claude/skills/"],
    },
  },
  {
    name: "ClawdBot",
    skills: {
      system: ["~/.openclaw/skills/"],
      project: [".openclaw/skills/"],
    },
  },
  {
    name: "Cline",
    skills: {
      system: [],
      project: [".cline/"],
    },
  },
  {
    name: "Codex",
    skills: {
      system: ["~/.agents/skills/"],
      project: [".agents/skills/", ".claude/skills/"],
    },
  },
  {
    name: "Cursor",
    skills: {
      system: [],
      project: [".cursor/rules/"],
    },
  },
  {
    name: "Droid",
    skills: {
      system: ["~/.factory/skills/"],
      project: [".factory/skills/"],
    },
  },
  {
    name: "Gemini",
    skills: {
      system: [],
      project: [],
    },
  },
  {
    name: "GitHub Copilot",
    skills: {
      system: ["~/.copilot/skills/", "~/.claude/skills/"],
      project: [".github/skills/", ".claude/skills/", ".agents/skills/"],
    },
  },
  {
    name: "Goose",
    skills: {
      system: ["~/.config/agents/skills/"],
      project: [".agents/skills/"],
    },
  },
  {
    name: "Kilo",
    skills: {
      system: ["~/.kilocode/skills/"],
      project: [".kilocode/skills/"],
    },
  },
  {
    name: "Kiro CLI",
    skills: {
      system: ["~/.kiro/skills/"],
      project: [".kiro/skills/"],
    },
  },
  {
    name: "Nous Research",
    skills: {
      system: [],
      project: [],
    },
  },
  {
    name: "OpenCode",
    skills: {
      system: ["~/.config/opencode/skills/"],
      project: [".opencode/skills/", "skill/"],
    },
  },
  {
    name: "Roo",
    skills: {
      system: ["~/.roo/skills/"],
      project: [".roo/skills/"],
    },
  },
  {
    name: "Trae",
    skills: {
      system: ["~/.trae/skills/"],
      project: [".trae/skills/"],
    },
  },
  {
    name: "VSCode",
    skills: {
      system: ["~/.copilot/skills/"],
      project: [".github/skills/", ".claude/skills/", ".agents/skills/"],
    },
  },
  {
    name: "Windsurf",
    skills: {
      system: ["~/.windsurf/skills/"],
      project: [".windsurf/skills/"],
    },
  },
];

/**
 * Find platform by project directory name
 * @param dirName e.g., ".windsurf", ".github", ".cline"
 * @returns Platform config if found, undefined otherwise
 */
export function findPlatformByProjectDir(dirName: string): AgentDirConfig | undefined {
  return AGENT_DIR_CONFIG.find((platform) =>
    platform.skills.project.some((path) => path.startsWith(dirName))
  );
}

/**
 * Expand ~ to home directory
 */
export function expandPath(filePath: string): string {
  if (filePath.startsWith("~")) {
    return filePath.replace("~", process.env.HOME || "");
  }
  return filePath;
}
