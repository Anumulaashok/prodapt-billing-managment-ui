import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';
import './Dashboard.css';

const TENANT_LINKS = [
  { to: '/accounts', label: 'Accounts', desc: 'Search, create, and manage customer accounts.' },
  { to: '/invoices', label: 'Invoices', desc: 'Browse invoices and trigger manual runs.' },
  { to: '/payments', label: 'Payments', desc: 'View payments, methods, refunds, and chargebacks.' },
  { to: '/admin/users', label: 'Users & Permissions', desc: 'Manage logins, roles, and (for root) tenant access.' },
];

const ROOT_ONLY_LINKS = [
  { to: '/admin/tenants', label: 'Tenants', desc: 'Provision and list every tenant on the platform.' },
  { to: '/admin/roles', label: 'Role Definitions', desc: 'Define permission sets that roles grant.' },
];

export function Dashboard() {
  const { currentUser } = useAuth();
  const { currentTenant, availableTenants, loading } = useTenant();

  return (
    <div className="dashboard">
      <div className="dashboard__welcome">
        <h1>Welcome{currentUser ? `, ${currentUser.username}` : ''}</h1>
        {currentUser?.isRoot ? (
          <p>
            You're signed in as the <strong>root admin</strong> — provision tenants and staff logins from Admin,
            or pick a tenant above to browse its accounts, subscriptions, and invoices.
          </p>
        ) : loading ? (
          <p>Loading your tenant…</p>
        ) : currentTenant ? (
          <p>
            Everything below is scoped to your tenant, <strong>{currentTenant.externalKey || currentTenant.tenantId}</strong>.
            {availableTenants.length > 1 && ' Switch tenants using the picker in the top bar.'}
          </p>
        ) : (
          <p className="dashboard__warning">
            No tenant is assigned to your account yet — ask your admin to grant you access under Admin → Users.
          </p>
        )}
      </div>

      <h2 className="dashboard__section-title">Get started</h2>
      <div className="dashboard__grid">
        {TENANT_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="dashboard__card">
            <strong>{link.label}</strong>
            <p>{link.desc}</p>
          </Link>
        ))}
      </div>

      {currentUser?.isRoot && (
        <>
          <h2 className="dashboard__section-title">Platform administration</h2>
          <div className="dashboard__grid">
            {ROOT_ONLY_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="dashboard__card">
                <strong>{link.label}</strong>
                <p>{link.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
