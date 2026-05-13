import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const handleLogin = () => navigate('/login');
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.reload();
  };

  return (
    <header className="nav">
      <div className="container nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark">S</span>
          <span>Skills Hub</span>
        </NavLink>
        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>{t('nav.home')}</NavLink>
          <NavLink
            to="/explore"
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            {t('nav.artifacts')}
          </NavLink>
          <NavLink
            to="/publish"
            className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
          >
            {t('nav.publish')}
          </NavLink>
          {token ? (
            <NavLink
              to="/me"
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
            >
              {t('nav.my', 'My')}
            </NavLink>
          ) : null}
        </nav>
        <div className="nav-spacer" />
        {token ? (
          <button className="nav-cta" type="button" onClick={handleLogout}>
            {t('nav.logout')}
          </button>
        ) : (
          <button className="nav-cta" type="button" onClick={handleLogin}>
            {t('login.submit')}
          </button>
        )}
      </div>
    </header>
  );
}
