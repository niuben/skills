import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { clearToken, getToken } from "../api";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { setAdminLanguage } from "../i18n";

const NAV_ITEMS = [
  { to: "/", key: "nav.dashboard" },
  { to: "/artifacts", key: "nav.artifacts" },
  { to: "/users", key: "nav.users" },
  { to: "/settings", key: "nav.settings" },
];

export function AdminLayout() {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  const [username, setUsername] = useState<string | null>(null);
  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState(i18n.language || "en");

  useEffect(() => {
    try {
      const token = getToken();
      if (!token) return;
      const parts = token.split(".");
      if (parts.length < 2) return;
      const payload = JSON.parse(decodeURIComponent(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")).split("").map(function(c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      }).join("")));
      // common fields: username, name, sub
      setUsername((payload.username as string) || (payload.name as string) || (payload.sub as string) || null);
    } catch (e) {
      // ignore, fallback will be used
    }
  }, []);

  useEffect(() => {
    setLang(i18n.language || "en");
  }, [i18n.language]);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <div className="admin-brand-mark">S</div>
          <div>
            <strong>SkillOS</strong>
            <span>{t("admin.console")}</span>
          </div>
        </Link>
          <select
            aria-label="Language"
            value={lang}
            onChange={(e) => {
              const l = e.target.value;
              setLang(l);
              setAdminLanguage(l);
            }}
            className="admin-lang-select"
          >
            <option value="en">EN</option>
            <option value="zh">中文</option>
            <option value="ja">日本語</option>
          </select>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className="admin-nav-link">
              {t(item.key)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user-row">
          <span className="sidebar-username">{username ?? "当前用户"}</span>
          <a
            href="#"
            className="sidebar-logout-link"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
          >
            退出
          </a>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
