import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { searchArtifacts } from "../api";
import { ArtifactCard } from "../components/ArtifactCard";
import type { ArtifactRecord } from "../types";

export function MyPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [items, setItems] = useState<ArtifactRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null;
        const res = await searchArtifacts({ 
          username: username ?? undefined,
          limit: 200 
        });
        const items = res.items;
        if (mounted) setItems(items);
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false };
  }, []);

  return (
    <div className="section">
      <div className="container">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h1>{t('profile.title', 'My uploads')}</h1>
          <button className="btn btn-primary" onClick={() => navigate('/publish')}>{t('publish.action.submit', 'Publish')}</button>
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : items.length === 0 ? (
          <div className="empty">
            <p>{t('profile.empty', 'You have not published any artifacts yet.')}</p>
            <button className="btn" onClick={() => navigate('/publish')}>{t('profile.publish_cta', 'Publish your first artifact')}</button>
          </div>
        ) : (
          <div className="grid">
            {items.map((a) => (
              <ArtifactCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyPage;
