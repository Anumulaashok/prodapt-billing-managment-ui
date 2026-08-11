import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '../../api/client';
import { createTagDefinition, deleteTagDefinition, listAllTagDefinitions } from '../../api/tags';
import type { TagDefinitionResponse } from '../../api/tags';
import '../accounts/Accounts.css';

/**
 * Tag Definitions — /tags/definitions. Lists every tag definition in the
 * current tenant, with a create form and per-row delete.
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
    if (!name.trim() || !applicableObjectTypes.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createTagDefinition({
        name: name.trim(),
        description: description.trim(),
        applicableObjectTypes: applicableObjectTypes.trim(),
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
        <h1>Tag Definitions</h1>
      </div>

      {loading && <p>Loading tag definitions…</p>}
      {error && <div className="accounts-error">{error}</div>}

      {!loading && !error && (
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Applicable Object Types</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {definitions.length === 0 && (
              <tr>
                <td colSpan={4} className="accounts-table__empty">
                  No tag definitions found.
                </td>
              </tr>
            )}
            {definitions.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>{d.description || <span className="accounts-muted">—</span>}</td>
                <td>{d.applicableObjectTypes || <span className="accounts-muted">—</span>}</td>
                <td>
                  <button className="account-detail__remove-btn" onClick={() => handleDelete(d.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="accounts-form" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginTop: 0 }}>Create Tag Definition</h3>
        {createError && <div className="accounts-error">{createError}</div>}
        <form onSubmit={handleCreate}>
          <div className="accounts-form__field">
            <label>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="accounts-form__field">
            <label>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="accounts-form__field">
            <label>Applicable Object Types (e.g. ACCOUNT, INVOICE, BUNDLE, PAYMENT)</label>
            <input
              value={applicableObjectTypes}
              onChange={(e) => setApplicableObjectTypes(e.target.value)}
              placeholder="ACCOUNT"
            />
          </div>
          <div className="accounts-form__actions">
            <button
              type="submit"
              className="accounts-btn accounts-btn--primary"
              disabled={creating || !name.trim() || !applicableObjectTypes.trim()}
            >
              {creating ? 'Creating…' : 'Create Tag Definition'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
