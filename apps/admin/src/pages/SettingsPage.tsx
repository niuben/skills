import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import type { SystemSettings } from "../types";

export function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    api.settings().then(setSettings);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setSettings(await api.updateSettings(settings));
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setSettings(await api.uploadLogo(file));
  }

  if (!settings) return <section className="page">加载中...</section>;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">Settings</span>
          <h1>系统设置</h1>
        </div>
      </header>
      <form className="panel settings-form" onSubmit={submit}>
        <label>
          系统名称
          <input value={settings.siteName} onChange={(event) => setSettings({ ...settings, siteName: event.target.value })} />
        </label>
        <label>
          主色
          <input
            value={settings.primaryColor}
            onChange={(event) => setSettings({ ...settings, primaryColor: event.target.value })}
            type="color"
          />
        </label>
        <label className="switch-row">
          <input
            checked={settings.requireApproval}
            onChange={(event) => setSettings({ ...settings, requireApproval: event.target.checked })}
            type="checkbox"
          />
          发布资源需要审批
        </label>
        <label>
          上传 Logo
          <input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
        {settings.logoPath ? <img className="logo-preview" src={settings.logoPath} alt="Logo" /> : null}
        <button className="primary-button" type="submit">保存设置</button>
      </form>
    </section>
  );
}
