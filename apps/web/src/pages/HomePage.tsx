import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchArtifacts } from "../api";
import type { ArtifactRecord } from "../types";
import { ArtifactCard } from "../components/ArtifactCard";

const SUGGEST_TAGS = ["代码评审", "发布剧本", "Prompt 工程", "数据分析", "故障复盘", "UI 评审"];

export function HomePage() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [recommended, setRecommended] = useState<ArtifactRecord[]>([]);

  useEffect(() => {
    searchArtifacts({ limit: 6 }).then((r) => setRecommended(r.items));
  }, []);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    nav(`/explore?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <>
      <section className="hero">
        <div className="container">
          <span className="hero-eyebrow">Skills · Prompts · Agents</span>
          <h1 className="hero-title">
            企业级 <em>AI 能力</em> 的统一中心
          </h1>
          <p className="hero-subtitle">
            搜索、发现、安装并复用经过团队验证的 Skills、Prompts 与 Agents。
            像管理依赖一样管理你的 AI 能力。
          </p>

          <form className="hero-search" onSubmit={submit}>
            <span style={{ color: "var(--text-faint)", fontSize: 18 }}>⌕</span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索 skills、prompts、agents…"
            />
            <button type="submit">搜索</button>
          </form>

          <div className="hero-tags">
            {SUGGEST_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                className="hero-tag"
                onClick={() => nav(`/explore?q=${encodeURIComponent(t)}`)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2 className="section-title">推荐 Skills</h2>
              <p className="section-subtitle">来自团队近期发布与高频使用的能力</p>
            </div>
            <a href="/explore" className="section-link">
              查看全部 →
            </a>
          </div>

          {recommended.length === 0 ? (
            <div className="empty">暂无推荐内容</div>
          ) : (
            <div className="cards">
              {recommended.map((a) => (
                <ArtifactCard key={a.id} a={a} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
