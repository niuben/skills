import { useEffect, useState } from "react";
import { api } from "../api";
import type { ApprovalStatus, ArtifactRecord } from "../types";

const FILTERS: { value: ApprovalStatus | "all"; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "approved", label: "已审批" },
  { value: "pending", label: "未审批" },
  { value: "rejected", label: "已拒绝" },
];

export function ArtifactsPage() {
  const [filter, setFilter] = useState<ApprovalStatus | "all">("all");
  const [items, setItems] = useState<ArtifactRecord[]>([]);

  function reload() {
    api.artifacts(filter).then((data) => setItems(data.items));
  }

  useEffect(() => {
    reload();
  }, [filter]);

  async function update(id: string, approvalStatus: ApprovalStatus) {
    await api.updateApproval(id, approvalStatus);
    reload();
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Artifacts</span>
          <h1>资源管理</h1>
        </div>
        <div className="segmented">
          {FILTERS.map((item) => (
            <button key={item.value} className={filter === item.value ? "active" : ""} onClick={() => setFilter(item.value)}>
              {item.label}
            </button>
          ))}
        </div>
      </header>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>资源</th>
              <th>类型</th>
              <th>版本</th>
              <th>状态</th>
              <th>作者</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <small>{item.description || "暂无描述"}</small>
                </td>
                <td>{item.kind}</td>
                <td>{item.version}</td>
                <td><span className={`status ${item.approvalStatus ?? "approved"}`}>{labelStatus(item.approvalStatus)}</span></td>
                <td>{item.author?.name ?? "-"}</td>
                <td className="actions">
                  <button onClick={() => update(item.id, "approved")}>通过</button>
                  <button onClick={() => update(item.id, "pending")}>待审</button>
                  <button onClick={() => update(item.id, "rejected")}>拒绝</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function labelStatus(status = "approved") {
  return status === "pending" ? "未审批" : status === "rejected" ? "已拒绝" : "已审批";
}
