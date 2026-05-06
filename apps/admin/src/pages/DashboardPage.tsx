import { useEffect, useState } from "react";
import { api } from "../api";
import { StatCard } from "../components/StatCard";
import type { DashboardStats } from "../types";

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.dashboard().then(setStats).catch(() => setStats(null));
  }, []);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>数字大盘</h1>
        </div>
      </header>

      <div className="stats-grid">
        <StatCard label="Skills" value={stats?.skills ?? 0} />
        <StatCard label="Prompts" value={stats?.prompts ?? 0} />
        <StatCard label="Agents" value={stats?.agents ?? 0} />
        <StatCard label="本日新建" value={stats?.createdToday ?? 0} />
        <StatCard label="本月新建" value={stats?.createdThisMonth ?? 0} />
        <StatCard label="人员数量" value={stats?.users ?? 0} />
        <StatCard label="待审批" value={stats?.pendingApprovals ?? 0} tone="warn" />
      </div>

      <div className="panel">
        <div className="panel-title">最近资源</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>版本</th>
                <th>状态</th>
                <th>发布时间</th>
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

function labelStatus(status = "approved") {
  return status === "pending" ? "未审批" : status === "rejected" ? "已拒绝" : "已审批";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("zh-CN");
}
