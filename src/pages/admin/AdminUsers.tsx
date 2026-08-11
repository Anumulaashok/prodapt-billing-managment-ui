import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../api/client';
import {
  assignUserRoles,
  assignUserTenants,
  createUser,
  disableUser,
  getUserTenants,
  listRoles,
  listUsers,
} from '../../api/admin';
import type { UserResponse, TenantResponse, RoleResponse } from '../../api/admin';
import { listTenants } from '../../api/admin';
import { LockedBadge } from '../../components/Locked';
import './Admin.css';

/** Multi-select role dropdown, populated from GET /1.0/kb/security/roles. */
function RoleSelect({
  availableRoles,
  selected,
  onChange,
}: {
  availableRoles: RoleResponse[];
  selected: string[];
  onChange: (roles: string[]) => void;
}) {
  return (
    <select
      multiple
      value={selected}
      onChange={(e) => onChange(Array.from(e.target.selectedOptions, (o) => o.value))}
      style={{
        padding: '0.5rem 0.65rem',
        borderRadius: 'var(--prodapt-radius)',
        border: '1px solid var(--prodapt-border)',
        fontSize: '0.875rem',
        minHeight: '6rem',
      }}
    >
      {availableRoles.length === 0 && (
        <option disabled value="">
          No roles defined yet — create one under Role Definitions
        </option>
      )}
      {availableRoles.map((r) => (
        <option key={r.role} value={r.role}>
          {r.role}
        </option>
      ))}
    </select>
  );
}

/** Admin > Users & Permissions — /admin/users. List, create, assign roles/tenants. */
export function AdminUsers() {
  const { currentUser } = useAuth();
  const isRoot = currentUser?.isRoot ?? false;

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleResponse[]>([]);
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
  useEffect(() => {
    listRoles()
      .then(setAvailableRoles)
      .catch(() => undefined);
  }, []);

  const expandedUser = users.find((u) => u.username === expanded) ?? null;

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

      {expandedUser && (
        <UserDetailPanel
          username={expandedUser.username}
          initialRoles={expandedUser.roles}
          availableRoles={availableRoles}
          isRoot={isRoot}
          onChanged={reload}
          onClose={() => setExpanded(null)}
        />
      )}

      <CreateUserPanel availableRoles={availableRoles} onCreated={reload} />
    </div>
  );
}

function UserDetailPanel({
  username,
  initialRoles,
  availableRoles,
  isRoot,
  onChanged,
  onClose,
}: {
  username: string;
  initialRoles: string[];
  availableRoles: RoleResponse[];
  isRoot: boolean;
  onChanged: () => void;
  onClose: () => void;
}) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles);
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
    setSavingRoles(true);
    setError(null);
    try {
      await assignUserRoles(username, selectedRoles);
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
        <label>Roles (ctrl/cmd-click to select multiple)</label>
        <RoleSelect availableRoles={availableRoles} selected={selectedRoles} onChange={setSelectedRoles} />
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

function CreateUserPanel({
  availableRoles,
  onCreated,
}: {
  availableRoles: RoleResponse[];
  onCreated: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await createUser(username.trim(), password, roles);
      setUsername('');
      setPassword('');
      setRoles([]);
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
          <label>Roles (ctrl/cmd-click to select multiple)</label>
          <RoleSelect availableRoles={availableRoles} selected={roles} onChange={setRoles} />
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={creating}>
          {creating ? 'Creating…' : 'Create User'}
        </button>
      </form>
    </div>
  );
}
