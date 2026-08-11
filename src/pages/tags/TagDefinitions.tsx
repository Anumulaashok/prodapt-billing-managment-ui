import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { createTagDefinition, deleteTagDefinition, listAllTagDefinitions } from '../../api/tags';
import type { TagDefinitionResponse } from '../../api/tags';
import '../accounts/Accounts.css';
import '../admin/Admin.css';
import './Tags.css';

const OBJECT_TYPES = ['ACCOUNT', 'BUNDLE', 'SUBSCRIPTION', 'INVOICE', 'PAYMENT', 'INVOICE_PAYMENT'];

/**
 * Tag Definitions — /tags/definitions. Lists every tag definition in the
 * current tenant, with a create form and per-row delete. Reuses Admin.css's
 * panel/form pattern (already proven on AdminTenants/AdminUsers) for the
 * create form, rather than the Accounts.css form classes, which now belong
 * to the sectioned Account create/edit page layout.
 */
export function TagDefinitions() {
  const [definitions, setDefinitions] = useState<TagDefinitionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [applicableObjectTypes, setApplicableObjectTypes] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  function reload() {
    setLoading(true);
    setError(null);
    listAllTagDefinitions()
      .then(setDefinitions)
      .catch(() => setError('Unable to load tag definitions.'))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !applicableObjectTypes) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createTagDefinition({
        name: name.trim(),
        description: description.trim(),
        applicableObjectTypes,
      });
      setName('');
      setDescription('');
      setApplicableObjectTypes('');
      reload();
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? `Failed to create tag definition: ${err.message}` : 'Failed to create tag definition.',
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(tagDefinitionId: string) {
    try {
      await deleteTagDefinition(tagDefinitionId);
      reload();
    } catch {
      setError('Failed to delete tag definition.');
    }
  }

  return (
    <div className="accounts-page">
      <div className="accounts-page__header">
        <div>
          <h1>Tag Definitions</h1>
          <p className="tags-page__subtitle">
            Define the tags your team can attach to accounts, bundles, invoices, and payments.
          </p>
        </div>
      </div>

      {loading && <p>Loading tag definitions…</p>}
      {error && <div className="accounts-error">{error}</div>}

      {!loading && !error && (
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Applies To</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {definitions.length === 0 && (
              <tr>
                <td colSpan={4} className="accounts-table__empty">
                  No tag definitions yet — create your first one below.
                </td>
              </tr>
            )}
            {definitions.map((d) => (
              <tr key={d.id}>
                <td>
                  <strong>{d.name}</strong>
                </td>
                <td>{d.description || <span className="accounts-muted">—</span>}</td>
                <td>
                  {d.applicableObjectTypes ? (
                    <span className="tags-page__type-badge">{d.applicableObjectTypes}</span>
                  ) : (
                    <span className="accounts-muted">—</span>
                  )}
                </td>
                <td>
                  <button className="tags-page__delete-btn" onClick={() => handleDelete(d.id)} title="Delete tag definition">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="admin-panel" style={{ marginTop: '1.5rem', maxWidth: 480 }}>
        <h3 style={{ marginTop: 0 }}>Create Tag Definition</h3>
        {createError && <div className="admin-error">{createError}</div>}
        <form onSubmit={handleCreate}>
          <div className="admin-form__field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. VIP" />
          </div>
          <div className="admin-form__field">
            <label>Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What this tag means" />
          </div>
          <div className="admin-form__field">
            <label>Applies to</label>
            <select value={applicableObjectTypes} onChange={(e) => setApplicableObjectTypes(e.target.value)}>
              <option value="">Select an object type…</option>
              {OBJECT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form__actions">
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={creating || !name.trim() || !applicableObjectTypes}
            >
              {creating ? 'Creating…' : 'Create Tag Definition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
