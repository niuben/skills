export async function login(username: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
}
import type { ArtifactKind, ArtifactRecord, SearchResult } from "./types";

export interface PublishArtifactInput {
  manifest: {
    kind: ArtifactKind;
    name: string;
    version: string;
    description?: string;
    readme?: string;
    tags?: string[];
  };
  payload: Blob;
  payloadName?: string;
}

const BASE = "/api";

async function safeFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function searchArtifacts(opts: {
  kind?: ArtifactKind;
  text?: string;
  limit?: number;
} = {}): Promise<SearchResult> {
  const params = new URLSearchParams();
  if (opts.kind) params.set("kind", opts.kind);
  if (opts.text) params.set("q", opts.text);
  if (opts.limit != null) params.set("limit", String(opts.limit));
  const data = await safeFetch<SearchResult>(`/artifacts?${params}`);
  if (data) return data;
  // fallback to mock data so UI still demos when server is offline
  const items = MOCK.filter((a) => {
    if (opts.kind && a.kind !== opts.kind) return false;
    if (opts.text) {
      const t = opts.text.toLowerCase();
      if (
        !a.name.toLowerCase().includes(t) &&
        !(a.description ?? "").toLowerCase().includes(t) &&
        !(a.tags ?? []).join(" ").toLowerCase().includes(t)
      )
        return false;
    }
    return true;
  });
  return { total: items.length, items };
}

export async function getArtifact(id: string): Promise<ArtifactRecord | null> {
  const data = await safeFetch<ArtifactRecord>(`/artifacts/${encodeURIComponent(id)}`);
  if (data) return data;
  return MOCK.find((a) => a.id === id) ?? null;
}

export async function publishArtifact(input: PublishArtifactInput): Promise<ArtifactRecord> {
  const form = new FormData();
  form.append("manifest", JSON.stringify(input.manifest));
  form.append(
    "payload",
    input.payload,
    input.payloadName ?? `${input.manifest.name}-${input.manifest.version}.tgz`
  );

  const res = await fetch(`${BASE}/artifacts`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let message = `publish failed: ${res.status}`;
    try {
      const data = (await res.json()) as { error?: string; message?: string };
      if (data?.message) message = data.message;
      else if (data?.error) message = data.error;
    } catch {
      // keep fallback message
    }
    throw new Error(message);
  }

  return (await res.json()) as ArtifactRecord;
}

/* ---------- Mock data (used when server is offline) ---------- */
export const MOCK: ArtifactRecord[] = [
  {
    id: "skills:team/code-review@1.2.0",
    kind: "skills",
    name: "team/code-review",
    version: "1.2.0",
    description:
      "高质量 TypeScript / React 代码评审：聚焦正确性、可维护性、性能与安全。自动列出阻断项与建议项。",
    tags: ["code", "review", "typescript", "react"],
    author: { name: "Platform Team" },
    license: "Apache-2.0",
    contentHash: "8e7c5b2a4d1f0a6b3c9e8d7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b",
    size: 24851,
    storagePath: "skills/team/code-review/1.2.0.tgz",
    publishedAt: "2026-04-12T08:21:00Z",
  },
  {
    id: "skills:team/release-runbook@0.4.1",
    kind: "skills",
    name: "team/release-runbook",
    version: "0.4.1",
    description: "标准发布流程与回滚剧本：含发布前检查清单、灰度策略与紧急回滚步骤。",
    tags: ["release", "ops", "runbook"],
    author: { name: "SRE" },
    contentHash: "1234abcd",
    size: 8123,
    storagePath: "skills/team/release-runbook/0.4.1.tgz",
    publishedAt: "2026-04-09T03:15:00Z",
  },
  {
    id: "prompt:writing/zh-claude-style@1.0.0",
    kind: "prompt",
    name: "writing/zh-claude-style",
    version: "1.0.0",
    description: "按 Claude 官网风格输出中文：先结论后步骤，结构化、克制、可执行。",
    tags: ["prompt", "writing", "claude", "zh"],
    author: { name: "DX Guild" },
    contentHash: "abcd1234",
    size: 2381,
    storagePath: "prompt/writing/zh-claude-style/1.0.0.tgz",
    publishedAt: "2026-04-20T11:02:00Z",
  },
  {
    id: "agent/data/sql-explainer@0.2.0",
    kind: "agent",
    name: "data/sql-explainer",
    version: "0.2.0",
    description: "把复杂 SQL 翻译成中文步骤说明，支持给出执行计划要点与潜在性能风险。",
    tags: ["agent", "sql", "data"],
    author: { name: "Data Platform" },
    contentHash: "9999aaaa",
    size: 15422,
    storagePath: "agent/data/sql-explainer/0.2.0.tgz",
    publishedAt: "2026-03-29T14:50:00Z",
  },
  {
    id: "skills:design/ui-review@0.9.0",
    kind: "skills",
    name: "design/ui-review",
    version: "0.9.0",
    description: "UI 评审清单：信息架构、对比度、可达性、动效节奏与品牌一致性。",
    tags: ["design", "ui", "a11y"],
    author: { name: "Design Ops" },
    contentHash: "ddddeeee",
    size: 6781,
    storagePath: "skills/design/ui-review/0.9.0.tgz",
    publishedAt: "2026-04-22T02:11:00Z",
  },
  {
    id: "prompt:eng/incident-postmortem@1.1.0",
    kind: "prompt",
    name: "eng/incident-postmortem",
    version: "1.1.0",
    description: "故障复盘模板：时间线、影响面、根因、改进项与负责人。",
    tags: ["incident", "ops", "template"],
    author: { name: "SRE" },
    contentHash: "ffffgggg",
    size: 3122,
    storagePath: "prompt/eng/incident-postmortem/1.1.0.tgz",
    publishedAt: "2026-04-01T07:00:00Z",
  },
];
