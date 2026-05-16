import { Link } from "react-router-dom";
import type { ArtifactRecord } from "../types";

export function ArtifactCard({ a }: { a: ArtifactRecord }) {
  return (
    <Link to={`/skills/${encodeURIComponent(a.id)}`} className="card">
      <span className={`card-kind ${a.kind}`}>
        <span className="dot" />
        {a.kind}
      </span>
      <h3 className="card-title">{a.name}</h3>
      <p className="card-desc">{a.description ?? "（暂无描述）"}</p>
      <div className="card-meta">
        <div className="card-tags">
          {(a.tags ?? []).slice(0, 3).map((t) => (
            <span key={t} className="tag">
              #{t}
            </span>
          ))}
        </div>
        <span>v{a.version} · ⬇ {(a.downloadCount ?? 0).toLocaleString()}</span>
      </div>
    </Link>
  );
}
