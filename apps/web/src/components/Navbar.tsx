import { NavLink, useNavigate } from "react-router-dom";
// ...existing code...

export function Navbar() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleLogin = () => {
    navigate('/login');
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">S</span>
          <span>SkillOS</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>首页</NavLink>
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
        {token ? (
          <button className="nav-cta" type="button" onClick={handleLogout}>
            退出
          </button>
        ) : (
          <button className="nav-cta" type="button" onClick={handleLogin}>
            登录
          </button>
        )}
      </div>
    </header>
  );
}
