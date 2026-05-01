import { NavLink } from "react-router-dom";

export function Navbar() {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">S</span>
          <span>SkillOS</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            首页
          </NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            浏览
          </NavLink>

          <NavLink
            to="/publish"
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            发布
          </NavLink>
        </nav>
        <div className="nav-spacer" />
        <button className="nav-cta" type="button">
          登录
        </button>
      </div>
    </header>
  );
}
