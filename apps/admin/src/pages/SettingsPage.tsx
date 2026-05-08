import { FormEvent, useEffect, useState } from "react";
import { api } from "../api";
import type { SystemSettings } from "../types";
import { useTranslation } from "react-i18next";
import { showToast } from "../components/Toast";

export function SettingsPage() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    api.settings().then(setSettings);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      showToast(t("settings.saved"));
    } catch (err) {
      showToast(t("settings.saveError"), "error");
    }
  }

  async function upload(file: File | undefined) {
    if (!file) return;
    setSettings(await api.uploadLogo(file));
  }

  if (!settings) return <section className="page">{t('settings.loading')}</section>;

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <span className="eyebrow">{t('settings.title')}</span>
          <h1>{t('settings.title')}</h1>
        </div>
      </header>
      <form className="panel settings-form" onSubmit={submit}>
        <label>
          {t('settings.siteName')}
          <input value={settings.siteName} onChange={(event) => setSettings({ ...settings, siteName: event.target.value })} />
        </label>
        <label>
          {t('settings.primaryColor')}
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
          {t('settings.requireApproval')}
        </label>
        <label>
          {t('settings.uploadLogo')}
          <input type="file" accept="image/*" onChange={(event) => upload(event.target.files?.[0])} />
        </label>
        {settings.logoPath ? <img className="logo-preview" src={settings.logoPath} alt="Logo" /> : null}
        <button className="primary-button" type="submit">{t('settings.save')}</button>
      </form>
    </section>
  );
}
