import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchArtifacts } from "../api";
import type { ArtifactKind, ArtifactRecord } from "../types";
import { ArtifactCard } from "../components/ArtifactCard";

const KINDS: { key: ArtifactKind | "all"; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "skill", label: "Skills" },
  { key: "prompt", label: "Prompts" },
  { key: "agent", label: "Agents" },
];

const TAG_GROUPS: { key: string; label: string }[] = [
  { key: "code", label: "代码" },
  { key: "review", label: "评审" },
  { key: "ops", label: "运维" },
  { key: "design", label: "设计" },
  { key: "data", label: "数据" },
  { key: "writing", label: "写作" },
];

export function ListPage() {
  const [params, setParams] = useSearchParams();
  const initialKind = (params.get("kind") as ArtifactKind | null) ?? "all";
  const initialQ = params.get("q") ?? "";
  const initialTag = params.get("tag") ?? "";

  const [kind, setKind] = useState<ArtifactKind | "all">(initialKind);
  const [tag, setTag] = useState<string>(initialTag);
  const [q, setQ] = useState<string>(initialQ);
  const [items, setItems] = useState<ArtifactRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    searchArtifacts({
      kind: kind === "all" ? undefined : kind,
      text: q || tag || undefined,
      limit: 100,
    })
      .then((r) => setItems(r.items))
      .finally(() => setLoading(false));

    const next = new URLSearchParams();
    if (kind !== "all") next.set("kind", kind);
    if (q) next.set("q", q);
    if (tag) next.set("tag", tag);
    setParams(next, { replace: true });
  }, [kind, q, tag, setParams]);

  const counts = useMemo(() => {
    const total = items.length;
    return { total };
  }, [items]);

  return (
    <div className="container list-layout">
      <aside className="sidebar">
        <div className="sidebar-group">
          <h4>类型</h4>
          {KINDS.map((k) => (
            <div
              key={k.key}
              className={"sidebar-item" + (kind === k.key ? " active" : "")}
              onClick={() => setKind(k.key)}
            >
              <span>{k.label}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-group">
          <h4>标签</h4>
          <div
            className={"sidebar-item" + (tag === "" ? " active" : "")}
            onClick={() => setTag("")}
          >
            <span>所有标签</span>
          </div>
          {TAG_GROUPS.map((t) => (
            <div
              key={t.key}
              className={"sidebar-item" + (tag === t.key ? " active" : "")}
              onClick={() => setTag(t.key)}
            >
              <span>#{t.label}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="list-main">
        <div className="list-toolbar">
          <div className="list-search">
            <span style={{ color: "var(--text-faint)" }}>⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索名称、描述、标签…"
            />
          </div>
          <span className="list-count">
            {loading ? "加载中…" : `共 ${counts.total} 个结果`}
          </span>
        </div>

        {items.length === 0 && !loading ? (
          <div className="empty">没有匹配的结果，换个关键字试试</div>
        ) : (
          <div className="cards">
            {items.map((a) => (
              <ArtifactCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
