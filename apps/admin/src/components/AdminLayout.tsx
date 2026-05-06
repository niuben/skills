import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearToken } from "../api";

const NAV_ITEMS = [
  { to: "/", label: "数字大盘" },
  { to: "/artifacts", label: "资源管理" },
  { to: "/users", label: "人员管理" },
  { to: "/settings", label: "系统设置" },
];

export function AdminLayout() {
  const navigate = useNavigate();

  function logout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">S</div>
          <div>
            <strong>SkillOS</strong>
            <span>Admin Console</span>
          </div>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === "/"} className="admin-nav-link">
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="ghost-button sidebar-logout" type="button" onClick={logout}>
          退出登录
        </button>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
