import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Navbar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const username = typeof window !== 'undefined' ? localStorage.getItem('username') : null;

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
          <span className="brand-mark">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="18" height="18">
              <rect x="4" y="5.5" width="3" height="7.5" rx="1.5" fill="currentColor"/>
              <rect x="25" y="5.5" width="3" height="7.5" rx="1.5" fill="currentColor"/>
              <rect x="6" y="10" width="20" height="3" rx="1" fill="currentColor"/>
              <path d="M7.5 13 L6.5 24 Q6.5 26 8.5 26.5 L23.5 26.5 Q25.5 26 25.5 24 L24.5 13 Z" fill="currentColor"/>
              <rect x="7.5" y="18" width="17" height="1.5" fill="var(--bg)" opacity="0.4"/>
              <rect x="8" y="26" width="4" height="5.5" rx="2" fill="currentColor"/>
              <rect x="20" y="26" width="4" height="5.5" rx="2" fill="currentColor"/>
              <rect x="14" y="26" width="4" height="4.5" rx="2" fill="currentColor" opacity="0.8"/>
            </svg>
          </span>
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
          <div className="nav-account">
            {username ? (
              <NavLink to="/me" className="nav-username" title={username}>
                {username}
              </NavLink>
            ) : null}
            <button className="nav-cta" type="button" onClick={handleLogout}>
              {t('nav.logout')}
            </button>
          </div>
        ) : (
          <button className="nav-cta" type="button" onClick={handleLogin}>
            {t('login.submit')}
          </button>
        )}
      </div>
    </header>
  );
}
