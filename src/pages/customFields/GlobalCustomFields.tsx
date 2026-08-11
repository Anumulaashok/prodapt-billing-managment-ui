import { useEffect, useState } from 'react';
import { listGlobalCustomFields } from '../../api/customFields';
import type { CustomFieldResponse } from '../../api/customFields';
import { Pagination } from '../../components/Pagination';
import '../accounts/Accounts.css';

const PAGE_SIZE = 50;

/**
 * Global Custom Fields — /custom-fields. Raw operational view across every
 * custom field set on any object in the current tenant, paginated straight
 * from the backend.
 */
export function GlobalCustomFields() {
  const [page, setPage] = useState(0);
  const [fields, setFields] = useState<CustomFieldResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listGlobalCustomFields(page, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setFields(result.customFields);
        setTotalCount(result.totalCount);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load custom fields.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="accounts-page">
      <div className="accounts-page__header">
        <h1>Global Custom Fields</h1>
      </div>

      {loading && <p>Loading custom fields…</p>}
      {error && <div className="accounts-error">{error}</div>}

      {!loading && !error && (
        <>
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Object Type</th>
                <th>Object ID</th>
                <th>Name</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 && (
                <tr>
                  <td colSpan={4} className="accounts-table__empty">
                    No custom fields found.
                  </td>
                </tr>
              )}
              {fields.map((f) => (
                <tr key={f.customFieldId}>
                  <td>{f.objectType}</td>
                  <td className="accounts-code-cell">{f.objectId}</td>
                  <td>{f.name}</td>
                  <td>{f.value || <span className="accounts-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} size={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
