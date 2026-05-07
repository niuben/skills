import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, setToken } from "../api";
import { useTranslation } from "react-i18next";

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(username, password);
      if (data.user.role !== "admin") {
        setError(t('login.no_permission'));
        return;
      }
      setToken(data.token);
      navigate("/", { replace: true });
    } catch (err) {
      setError((err as Error).message || t('login.failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-hero">
        <span className="eyebrow">{t('admin.console')}</span>
        <h1>{t('login.hero_title')}</h1>
        <p>{t('login.hero_desc')}</p>
      </section>
      <form className="login-panel" onSubmit={submit}>
        <h2>{t('login.panel_title')}</h2>
        <label>
          {t('users.form.username')}
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
        </label>
        <label>
          {t('users.form.password')}
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete="current-password"
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? t('login.loading') : t('login.panel_title')}
        </button>
        {error ? <div className="form-error">{error}</div> : null}
      </form>
    </div>
  );
}
