import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getArtifact } from "../api";
import type { ArtifactRecord } from "../types";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function DetailPage() {
  const { id = "" } = useParams();
  const [item, setItem] = useState<ArtifactRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getArtifact(decodeURIComponent(id))
      .then(setItem)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container">
        <div className="empty">加载中…</div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container">
        <div className="empty">找不到该制品</div>
      </div>
    );
  }

  const installCmd = `skillos install ${item.id}`;

  return (
    <div className="container detail">
      <article>
        <Link to="/explore" className="detail-back">
          ← 返回列表
        </Link>

        <div className={`detail-kind`}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background:
                item.kind === "prompt"
                  ? "#0891b2"
                  : item.kind === "agent"
                  ? "#7c3aed"
                  : "#d97706",
              display: "inline-block",
            }}
          />
          {item.kind} · v{item.version}
        </div>

        <h1 className="detail-title">{item.name}</h1>
        <p className="detail-desc">{item.description ?? "（暂无描述）"}</p>

        <div className="detail-section">
          <h2>安装</h2>
          <p style={{ color: "var(--text-muted)" }}>使用 SkillOS CLI 一键安装：</p>
          <pre className="code">{installCmd}</pre>
        </div>

        <div className="detail-section">
          <h2>说明</h2>
          {item.readme ? (
            <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{item.readme}</pre>
          ) : (
            <p style={{ color: "var(--text-muted)" }}>
              该制品未提供 README。包含完整的元数据、内容哈希校验与版本控制；
              通过 SkillOS 安装后可直接被本地 runtime 加载。
            </p>
          )}
        </div>

        <div className="detail-section">
          <h2>标签</h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {(item.tags ?? []).map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
            {(item.tags ?? []).length === 0 && (
              <span style={{ color: "var(--text-faint)", fontSize: 13 }}>无标签</span>
            )}
          </div>
        </div>
      </article>

      <aside className="detail-aside">
        <button className="btn btn-primary" type="button">
          安装到本地
        </button>
        <button className="btn" type="button">
          下载源包
        </button>

        <div className="aside-row">
          <span className="aside-label">ID</span>
          <span className="aside-value">{item.id}</span>
        </div>
        <div className="aside-row">
          <span className="aside-label">版本</span>
          <span className="aside-value">{item.version}</span>
        </div>
        <div className="aside-row">
          <span className="aside-label">作者</span>
          <span className="aside-value" style={{ fontFamily: "var(--font-sans)" }}>
            {item.author?.name ?? "—"}
          </span>
        </div>
        <div className="aside-row">
          <span className="aside-label">License</span>
          <span className="aside-value" style={{ fontFamily: "var(--font-sans)" }}>
            {item.license ?? "—"}
          </span>
        </div>
        <div className="aside-row">
          <span className="aside-label">大小</span>
          <span className="aside-value" style={{ fontFamily: "var(--font-sans)" }}>
            {formatBytes(item.size)}
          </span>
        </div>
        <div className="aside-row">
          <span className="aside-label">发布时间</span>
          <span className="aside-value" style={{ fontFamily: "var(--font-sans)" }}>
            {new Date(item.publishedAt).toLocaleString()}
          </span>
        </div>
        <div className="aside-row">
          <span className="aside-label">内容哈希</span>
          <span className="aside-value" style={{ fontSize: 12 }}>
            {item.contentHash.slice(0, 24)}…
          </span>
        </div>
      </aside>
    </div>
  );
}
