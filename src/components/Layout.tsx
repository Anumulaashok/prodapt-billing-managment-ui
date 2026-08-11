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

// Sections with no backend support yet. Rendered as inert, locked nav items
// so they're visible (users know the feature exists) without being clickable
// dead links. Update this list as backend endpoints for these land.
const LOCKED_ITEMS = [
  { label: 'Tags & Custom Fields (global)', tooltip: "Not yet available in Prodapt UI — manage these from an account's detail tabs instead." },
  { label: 'Tag Definitions', tooltip: 'Not yet available in Prodapt UI' },
  { label: 'Audit Log', tooltip: 'Not yet available in Prodapt UI' },
  { label: 'Notification Queues', tooltip: 'Not yet available in Prodapt UI' },
  { label: 'Catalog & Overdue Config', tooltip: 'Not yet available in Prodapt UI' },
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
            {LOCKED_ITEMS.map((item) => (
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
