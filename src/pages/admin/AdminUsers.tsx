import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';
import {
  assignUserRoles,
  assignUserTenants,
  createUser,
  disableUser,
  getUserTenants,
  listUsers,
} from '../../api/admin';
import type { UserResponse, TenantResponse } from '../../api/admin';
import { listTenants } from '../../api/admin';
import { LockedBadge } from '../../components/Locked';
import './Admin.css';

/** Admin > Users & Permissions — /admin/users. List, create, assign roles/tenants. */
export function AdminUsers() {
  const { currentUser } = useAuth();
  const isRoot = currentUser?.isRoot ?? false;

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    setError(null);
    listUsers()
      .then(setUsers)
      .catch(() => setError('Unable to load users.'))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  return (
    <div>
      {loading && <p>Loading users…</p>}
      {error && <div className="admin-error">{error}</div>}

      {!loading && !error && (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Status</th>
              <th>Roles</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.username}>
                <td>
                  <button
                    className="admin-tabs__tab"
                    style={{ padding: 0, borderBottom: 'none', fontWeight: 600, color: 'var(--prodapt-text-dark)' }}
                    onClick={() => setExpanded(expanded === u.username ? null : u.username)}
                  >
                    {u.username}
                  </button>
                </td>
                <td>{u.isActive ? 'Active' : 'Disabled'}</td>
                <td>
                  {u.roles.length === 0 && <span className="admin-muted">—</span>}
                  {u.roles.map((r) => (
                    <span className="admin-badge" key={r}>
                      {r}
                    </span>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {expanded && (
        <UserDetailPanel username={expanded} isRoot={isRoot} onChanged={reload} onClose={() => setExpanded(null)} />
      )}

      <CreateUserPanel onCreated={reload} />
    </div>
  );
}

function UserDetailPanel({
  username,
  isRoot,
  onChanged,
  onClose,
}: {
  username: string;
  isRoot: boolean;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [rolesInput, setRolesInput] = useState('');
  const [savingRoles, setSavingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userTenants, setUserTenants] = useState<TenantResponse[]>([]);
  const [allTenants, setAllTenants] = useState<TenantResponse[]>([]);
  const [selectedTenantIds, setSelectedTenantIds] = useState<Set<string>>(new Set());
  const [savingTenants, setSavingTenants] = useState(false);

  useEffect(() => {
    getUserTenants(username)
      .then((data) => {
        setUserTenants(data);
        setSelectedTenantIds(new Set(data.map((t) => t.tenantId)));
      })
      .catch(() => undefined);
    listTenants()
      .then((data) => setAllTenants(data.tenants))
      .catch(() => undefined);
  }, [username]);

  async function handleSaveRoles(e: FormEvent) {
    e.preventDefault();
    const roles = rolesInput
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);
    setSavingRoles(true);
    setError(null);
    try {
      await assignUserRoles(username, roles);
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update roles.');
    } finally {
      setSavingRoles(false);
    }
  }

  function toggleTenant(tenantId: string) {
    setSelectedTenantIds((prev) => {
      const next = new Set(prev);
      if (next.has(tenantId)) next.delete(tenantId);
      else next.add(tenantId);
      return next;
    });
  }

  async function handleSaveTenants() {
    setSavingTenants(true);
    setError(null);
    try {
      await assignUserTenants(username, Array.from(selectedTenantIds));
    } catch (err) {
      setError(err instanceof ApiError && err.status === 403 ? 'Only the root user can assign tenants.' : 'Failed to update tenants.');
    } finally {
      setSavingTenants(false);
    }
  }

  async function handleDisable() {
    setError(null);
    try {
      await disableUser(username);
      onChanged();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to disable user.');
    }
  }

  return (
    <div className="admin-panel">
      <h3 style={{ marginTop: 0 }}>{username}</h3>
      {error && <div className="admin-error">{error}</div>}

      <form onSubmit={handleSaveRoles} className="admin-form__field">
        <label>Roles (comma-separated)</label>
        <input
          placeholder="tenant_admin, support"
          value={rolesInput}
          onChange={(e) => setRolesInput(e.target.value)}
        />
        <div className="admin-form__actions">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={savingRoles}>
            {savingRoles ? 'Saving…' : 'Save Roles'}
          </button>
        </div>
      </form>

      <div style={{ marginTop: '1.25rem' }}>
        <label style={{ fontSize: '0.8rem', color: 'var(--prodapt-text-muted)' }}>Tenant Access</label>
        {!isRoot ? (
          <p className="admin-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            {userTenants.map((t) => t.externalKey || t.apiKey).join(', ') || 'No tenants assigned.'}
            <LockedBadge tooltip="Only the root user can change tenant assignments." />
          </p>
        ) : (
          <>
            <div className="admin-form__checkboxes" style={{ marginTop: '0.5rem' }}>
              {allTenants.map((t) => (
                <label className="admin-form__checkbox" key={t.tenantId}>
                  <input
                    type="checkbox"
                    checked={selectedTenantIds.has(t.tenantId)}
                    onChange={() => toggleTenant(t.tenantId)}
                  />
                  {t.externalKey || t.apiKey}
                </label>
              ))}
            </div>
            <div className="admin-form__actions">
              <button className="admin-btn" onClick={handleSaveTenants} disabled={savingTenants}>
                {savingTenants ? 'Saving…' : 'Save Tenant Access'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="admin-form__actions">
        <button className="admin-btn" onClick={handleDisable}>
          Disable User
        </button>
        <button className="admin-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function CreateUserPanel({ onCreated }: { onCreated: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createUser(
        username.trim(),
        password,
        roles
          .split(',')
          .map((r) => r.trim())
          .filter(Boolean),
      );
      setUsername('');
      setPassword('');
      setRoles('');
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? `Failed to create user: ${err.message}` : 'Failed to create user.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="admin-panel">
      <h3 style={{ marginTop: 0 }}>Create User</h3>
      {error && <div className="admin-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="admin-form__field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="admin-form__field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="admin-form__field">
          <label>Roles (comma-separated)</label>
          <input placeholder="tenant_admin" value={roles} onChange={(e) => setRoles(e.target.value)} />
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
          {creating ? 'Creating…' : 'Create User'}
        </button>
      </form>
    </div>
  );
}
