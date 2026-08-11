import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LockedNavItem } from './Locked';
import prodaptLogo from '../assets/prodapt-logo.svg';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/accounts', label: 'Accounts' },
  { to: '/subscriptions', label: 'Subscriptions' },
  { to: '/invoices', label: 'Invoices' },
  { to: '/payments', label: 'Payments' },
  { to: '/admin', label: 'Admin' },
];

// Deeper Admin sub-sections without a page yet in this scaffold. These are
// genuinely not built yet (unlike the top-level sections above, which are
// actively being built next) so they render as inert, locked nav items.
const LOCKED_ADMIN_ITEMS = [
  { label: 'Tenants', tooltip: 'Not yet available in Prodapt UI' },
  { label: 'Users & Permissions', tooltip: 'Not yet available in Prodapt UI' },
  { label: 'Plugins', tooltip: 'Not yet available in Prodapt UI' },
];

export function Layout() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="layout">
      <header className="layout__navbar">
        <Link to="/" className="layout__brand">
          <img src={prodaptLogo} alt="Prodapt" className="layout__logo" />
        </Link>
        <div className="layout__navbar-right">
          {currentUser && <span className="layout__username">{currentUser.username}</span>}
          <button type="button" className="layout__logout" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <div className="layout__body">
        <nav className="layout__sidebar">
          <ul className="layout__nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `layout__nav-link${isActive ? ' layout__nav-link--active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li className="layout__nav-divider" aria-hidden="true" />
            {LOCKED_ADMIN_ITEMS.map((item) => (
              <li key={item.label}>
                <LockedNavItem label={item.label} tooltip={item.tooltip} />
              </li>
            ))}
          </ul>
        </nav>

        <main className="layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
