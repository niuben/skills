import { useEffect, useState } from "react";
import { api } from "../api";
import type { ApprovalStatus, ArtifactRecord } from "../types";
import { useTranslation } from "react-i18next";

const FILTERS = ["all", "approved", "pending", "rejected"] as const;

export function ArtifactsPage() {
  const { t } = useTranslation();
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

  function labelStatus(status = "approved") {
    return status === "pending" ? t("status.pending") : status === "rejected" ? t("status.rejected") : t("status.approved");
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('artifacts.title')}</span>
          <h1>{t('artifacts.title')}</h1>
        </div>
        <div className="segmented">
          {FILTERS.map((value) => (
            <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
              {t(`artifacts.filters.${value}`)}
            </button>
          ))}
        </div>
      </header>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t('artifacts.table.resource')}</th>
              <th>{t('artifacts.table.type')}</th>
              <th>{t('artifacts.table.version')}</th>
              <th>{t('artifacts.table.status')}</th>
              <th>{t('artifacts.table.author')}</th>
              <th>{t('artifacts.table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  <small>{item.description || t('artifacts.table.no_description')}</small>
                </td>
                <td>{item.kind}</td>
                <td>{item.version}</td>
                <td><span className={`status ${item.approvalStatus ?? "approved"}`}>{labelStatus(item.approvalStatus)}</span></td>
                <td>{item.author?.name ?? "-"}</td>
                <td className="actions">
                  <button onClick={() => update(item.id, "approved")}>{t('artifacts.actions.approve')}</button>
                  <button onClick={() => update(item.id, "pending")}>{t('artifacts.actions.mark_pending')}</button>
                  <button onClick={() => update(item.id, "rejected")}>{t('artifacts.actions.reject')}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
