import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchArtifacts } from "../api";
import type { ArtifactRecord } from "../types";
import { ArtifactCard } from "../components/ArtifactCard";
import { useTranslation } from "react-i18next";

const SUGGEST_TAGS = ["代码评审", "发布剧本", "Prompt 工程", "数据分析", "故障复盘", "UI 评审"];

export function HomePage() {
  const { t } = useTranslation();
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
          <span className="hero-eyebrow">{t('hero.eyebrow')}</span>
          <h1 className="hero-title">
            {t('hero.title')}
          </h1>
          <p className="hero-subtitle">
            {t('hero.subtitle')}
          </p>

          <form className="hero-search" onSubmit={submit}>
            <span style={{ color: "var(--text-faint)", fontSize: 18 }}>⌕</span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('hero.search_placeholder', 'Search skills, prompts, agents...')}
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
              <h2 className="section-title">{t('home.recommended_title', 'Recommended Skills')}</h2>
              <p className="section-subtitle">{t('home.recommended_subtitle', 'From recent and frequently used team skills')}</p>
            </div>
            <a href="/explore" className="section-link">
              {t('home.view_all', 'View all →')}
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
