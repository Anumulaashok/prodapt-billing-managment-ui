import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTenant } from '../context/TenantContext';

const QUICK_LINKS = [
  { to: '/accounts', label: 'Accounts', desc: 'Search, create, and manage customer accounts.' },
  { to: '/invoices', label: 'Invoices', desc: 'Browse invoices and trigger manual runs.' },
  { to: '/payments', label: 'Payments', desc: 'View payments, methods, refunds, and chargebacks.' },
  { to: '/admin/tenants', label: 'Admin: Tenants', desc: 'Register and list tenants.' },
  { to: '/admin/users', label: 'Admin: Users', desc: 'Manage staff logins, roles, and tenant access.' },
];

export function Dashboard() {
  const { currentUser } = useAuth();
  const { currentTenant } = useTenant();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>
        Welcome{currentUser ? `, ${currentUser.username}` : ''}. Current tenant:{' '}
        <strong>{currentTenant.name}</strong>.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            style={{
              display: 'block',
              padding: '1rem',
              borderRadius: 'var(--prodapt-radius)',
              border: '1px solid var(--prodapt-border)',
              background: 'var(--prodapt-surface)',
              textDecoration: 'none',
              color: 'var(--prodapt-text-dark)',
            }}
          >
            <strong>{link.label}</strong>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: 'var(--prodapt-text-muted)' }}>{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
