import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';
import { createTenant, listTenants } from '../../api/admin';
import type { TenantResponse } from '../../api/admin';
import { LockedBadge } from '../../components/Locked';
import './Admin.css';

/**
 * Admin > Tenants — /admin/tenants. Only the root admin provisions tenants
 * (enforced by the backend, 403 for anyone else) -- a tenant-scoped caller
 * sees this list filtered to just their own tenant(s) and the create form
 * replaced with a Locked notice instead of a form that would just fail.
 */
export function AdminTenants() {
  const { currentUser } = useAuth();
  const isRoot = currentUser?.isRoot ?? false;

  const [tenants, setTenants] = useState<TenantResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [externalKey, setExternalKey] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdSecret, setCreatedSecret] = useState<TenantResponse | null>(null);

  function reload() {
    setLoading(true);
    setError(null);
    listTenants()
      .then((data) => setTenants(data.tenants))
      .catch(() => setError('Unable to load tenants.'))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    setCreatedSecret(null);
    try {
      const created = await createTenant(externalKey.trim() || undefined);
      setCreatedSecret(created);
      setExternalKey('');
      reload();
    } catch (err) {
      setCreateError(err instanceof ApiError ? `Failed to create tenant: ${err.message}` : 'Failed to create tenant.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div>
      {loading && <p>Loading tenants…</p>}
      {error && <div className="admin-error">{error}</div>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>External Key</th>
              <th>API Key</th>
              <th>Tenant ID</th>
            </tr>
          </thead>
          <tbody>
            {tenants.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No tenants found.
                </td>
              </tr>
            )}
            {tenants.map((t) => (
              <tr key={t.tenantId}>
                <td>{t.externalKey || <span className="admin-muted">—</span>}</td>
                <td>
                  <code>{t.apiKey}</code>
                </td>
                <td>
                  <span className="admin-muted">{t.tenantId}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isRoot ? (
        <div className="admin-panel">
          <h3 style={{ marginTop: 0 }}>Create Tenant</h3>
          {createError && <div className="admin-error">{createError}</div>}
          {createdSecret && (
            <div className="admin-error" style={{ color: 'var(--prodapt-success)' }}>
              Tenant created — API key <code>{createdSecret.apiKey}</code>, API secret{' '}
              <code>{createdSecret.apiSecret}</code>. The secret is shown only once — copy it now.
            </div>
          )}
          <form onSubmit={handleCreate}>
            <div className="admin-form__field" style={{ maxWidth: 320 }}>
              <label>External Key (optional)</label>
              <input value={externalKey} onChange={(e) => setExternalKey(e.target.value)} />
            </div>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
              {creating ? 'Creating…' : 'Create Tenant'}
            </button>
          </form>
        </div>
      ) : (
        <div className="admin-panel">
          <p className="admin-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}>
            Only the root admin can create tenants.
            <LockedBadge tooltip="Ask your root admin to provision new tenants." />
          </p>
        </div>
      )}
    </div>
  );
}
