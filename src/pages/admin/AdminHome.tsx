import { NavLink, Outlet, useLocation } from 'react-router-dom';
import './Admin.css';

const TABS = [
  { to: '/admin/tenants', label: 'Tenants' },
  { to: '/admin/users', label: 'Users & Permissions' },
  { to: '/admin/roles', label: 'Role Definitions' },
];

/**
 * Admin section shell — /admin/*. Provides the tab bar; the actual content
 * renders via nested routes (AdminTenants, AdminUsers, RoleDefinitionForm).
 */
export function AdminHome() {
  const location = useLocation();

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1>Admin</h1>
      </div>
      <div className="admin-tabs">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={() =>
              `admin-tabs__tab ${location.pathname.startsWith(tab.to) ? 'admin-tabs__tab--active' : ''}`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
