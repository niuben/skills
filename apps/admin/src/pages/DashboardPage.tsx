import { useEffect, useState } from "react";
import { api } from "../api";
import { StatCard } from "../components/StatCard";
import type { DashboardStats } from "../types";
import { useTranslation } from "react-i18next";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.dashboard().then(setStats).catch(() => setStats(null));
  }, []);

  const { t, i18n } = useTranslation();

  function labelStatus(status = "approved") {
    return status === "pending" ? t("status.pending") : status === "rejected" ? t("status.rejected") : t("status.approved");
  }

  function formatDate(value: string) {
    try {
      return new Intl.DateTimeFormat(i18n.language).format(new Date(value));
    } catch {
      return new Date(value).toLocaleString();
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('dashboard.eyebrow', 'Overview')}</span>
          <h1>{t('dashboard.title')}</h1>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard label={t('dashboard.stats.skills')} value={stats?.skills ?? 0} />
        <StatCard label={t('dashboard.stats.prompts')} value={stats?.prompts ?? 0} />
        <StatCard label={t('dashboard.stats.agents')} value={stats?.agents ?? 0} />
        <StatCard label={t('dashboard.stats.createdToday')} value={stats?.createdToday ?? 0} />
        <StatCard label={t('dashboard.stats.createdThisMonth')} value={stats?.createdThisMonth ?? 0} />
        <StatCard label={t('dashboard.stats.users')} value={stats?.users ?? 0} />
        <StatCard label={t('dashboard.stats.pendingApprovals')} value={stats?.pendingApprovals ?? 0} tone="warn" />
      </div>

      <div className="panel">
        <div className="panel-title">{t('dashboard.recent_title')}</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{t('dashboard.table.name')}</th>
                <th>{t('dashboard.table.kind')}</th>
                <th>{t('dashboard.table.version')}</th>
                <th>{t('dashboard.table.status')}</th>
                <th>{t('dashboard.table.publishedAt')}</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recentArtifacts ?? []).map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.kind}</td>
                  <td>{item.version}</td>
                  <td><span className={`status ${item.approvalStatus ?? "approved"}`}>{labelStatus(item.approvalStatus)}</span></td>
                  <td>{formatDate(item.publishedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


