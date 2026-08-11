import type { ReactElement } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import { LockedNavItem } from './Locked';
import prodaptLogo from '../assets/prodapt-logo.svg';
import './Layout.css';

const ICONS: Record<string, ReactElement> = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  accounts: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  subscriptions: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  ),
  invoices: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
  payments: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  admin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 3 6v6c0 5 3.8 9.4 9 10 5.2-.6 9-5 9-10V6l-9-4Z" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/accounts', label: 'Accounts', icon: 'accounts' },
  { to: '/subscriptions', label: 'Subscriptions', icon: 'subscriptions' },
  { to: '/invoices', label: 'Invoices', icon: 'invoices' },
  { to: '/payments', label: 'Payments', icon: 'payments' },
  { to: '/admin', label: 'Admin', icon: 'admin' },
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

function TenantSwitcher() {
  const { currentTenant, availableTenants, setCurrentTenant, loading } = useTenant();

  if (loading) {
    return <span className="layout__tenant-badge layout__tenant-badge--muted">Loading tenant…</span>;
  }
  if (!currentTenant) {
    return <span className="layout__tenant-badge layout__tenant-badge--muted">No tenant assigned</span>;
  }
  if (availableTenants.length <= 1) {
    return <span className="layout__tenant-badge">{currentTenant.externalKey || currentTenant.tenantId}</span>;
  }

  return (
    <select
      className="layout__tenant-select"
      value={currentTenant.tenantId}
      onChange={(e) => {
        const next = availableTenants.find((t) => t.tenantId === e.target.value);
        if (next) setCurrentTenant(next);
      }}
    >
      {availableTenants.map((t) => (
        <option key={t.tenantId} value={t.tenantId}>
          {t.externalKey || t.tenantId}
        </option>
      ))}
    </select>
  );
}

export function Layout() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="layout">
      <header className="layout__navbar">
        <Link to="/" className="layout__brand">
          <img src={prodaptLogo} alt="Prodapt" className="layout__logo" />
        </Link>
        <div className="layout__navbar-right">
          <TenantSwitcher />
          {currentUser && (
            <div className="layout__user">
              <span className="layout__avatar" aria-hidden="true">
                {currentUser.username.slice(0, 1).toUpperCase()}
              </span>
              <span className="layout__username">
                {currentUser.username}
                {currentUser.isRoot && <span className="layout__root-badge">root</span>}
              </span>
            </div>
          )}
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
                  <span className="layout__nav-icon">{ICONS[item.icon]}</span>
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
