import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { searchArtifacts } from "../api";
import type { ArtifactKind, ArtifactRecord } from "../types";
import { ArtifactCard } from "../components/ArtifactCard";

const KINDS: { key: ArtifactKind | "all"; labelKey: string }[] = [
  { key: "all", labelKey: "list.kind.all" },
  { key: "skills", labelKey: "list.kind.skills" },
  { key: "prompt", labelKey: "list.kind.prompt" },
  { key: "agent", labelKey: "list.kind.agent" },
];

const TAG_GROUPS: { key: string; labelKey: string }[] = [
  { key: "code", labelKey: "list.tag.code" },
  { key: "review", labelKey: "list.tag.review" },
  { key: "ops", labelKey: "list.tag.ops" },
  { key: "design", labelKey: "list.tag.design" },
  { key: "data", labelKey: "list.tag.data" },
  { key: "writing", labelKey: "list.tag.writing" },
];

export function ListPage() {
  const { t } = useTranslation();
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
          <h4>{t("list.section.kind")}</h4>
          {KINDS.map((k) => (
            <div
              key={k.key}
              className={"sidebar-item" + (kind === k.key ? " active" : "")}
              onClick={() => setKind(k.key)}
            >
              <span>{t(k.labelKey)}</span>
            </div>
          ))}
        </div>
        <div className="sidebar-group">
          <h4>{t("list.section.tag")}</h4>
          <div
            className={"sidebar-item" + (tag === "" ? " active" : "")}
            onClick={() => setTag("")}
          >
            <span>{t("list.tag.all")}</span>
          </div>
          {TAG_GROUPS.map((tagItem) => (
            <div
              key={tagItem.key}
              className={"sidebar-item" + (tag === tagItem.key ? " active" : "")}
              onClick={() => setTag(tagItem.key)}
            >
              <span>#{t(tagItem.labelKey)}</span>
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
              placeholder={t("list.search.placeholder")}
            />
          </div>
          <span className="list-count">
            {loading ? t("list.status.loading") : t("list.status.count", { total: counts.total })}
          </span>
        </div>

        {items.length === 0 && !loading ? (
          <div className="empty">{t("list.status.empty")}</div>
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
