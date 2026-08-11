import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { createOrUpdateRole, getMyPermissions, getRole } from '../../api/admin';
import './Admin.css';

/**
 * Admin > Role Definitions — /admin/roles. Create/update a role's permission
 * set. The available permission checklist comes from GET
 * /1.0/kb/security/permissions for the current (root) caller, which returns
 * the full set of valid permission strings rather than hardcoding them here.
 */
export function RoleDefinitions() {
  const [availablePermissions, setAvailablePermissions] = useState<string[]>([]);
  const [roleName, setRoleName] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getMyPermissions()
      .then((perms) => setAvailablePermissions(perms.filter((p) => p !== '*')))
      .catch(() => undefined);
  }, []);

  async function handleLookup() {
    if (!roleName.trim()) return;
    setLookupError(null);
    setSaved(false);
    try {
      const role = await getRole(roleName.trim());
      setSelected(new Set(role.permissions));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSelected(new Set());
      } else {
        setLookupError('Failed to look up role.');
      }
    }
  }

  function togglePermission(permission: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(permission)) next.delete(permission);
      else next.add(permission);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!roleName.trim()) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      await createOrUpdateRole(roleName.trim(), Array.from(selected));
      setSaved(true);
    } catch (err) {
      setSaveError(err instanceof ApiError ? `Failed to save role: ${err.message}` : 'Failed to save role.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="admin-panel" style={{ marginTop: 0 }}>
        <div className="admin-form__field" style={{ maxWidth: 360 }}>
          <label>Role name</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="tenant_admin" />
            <button type="button" className="admin-btn" onClick={handleLookup} disabled={!roleName.trim()}>
              Load
            </button>
          </div>
        </div>
        {lookupError && <div className="admin-error">{lookupError}</div>}

        <form onSubmit={handleSubmit}>
          <label style={{ fontSize: '0.8rem', color: 'var(--prodapt-text-muted)' }}>Permissions</label>
          <div className="admin-form__checkboxes" style={{ marginTop: '0.5rem', maxHeight: 320, overflowY: 'auto' }}>
            {availablePermissions.map((perm) => (
              <label className="admin-form__checkbox" key={perm}>
                <input type="checkbox" checked={selected.has(perm)} onChange={() => togglePermission(perm)} />
                {perm}
              </label>
            ))}
          </div>

          {saveError && <div className="admin-error">{saveError}</div>}
          {saved && (
            <div className="admin-error" style={{ color: 'var(--prodapt-success)' }}>
              Role saved.
            </div>
          )}

          <div className="admin-form__actions">
            <button type="submit" className="admin-btn admin-btn--primary" disabled={saving || !roleName.trim()}>
              {saving ? 'Saving…' : 'Save Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
