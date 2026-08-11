import { useEffect, useState } from 'react';
import { listGlobalTags } from '../../api/tags';
import type { TagResponse } from '../../api/tags';
import { listAllTagDefinitions } from '../../api/tags';
import type { TagDefinitionResponse } from '../../api/tags';
import { Pagination } from '../../components/Pagination';
import '../accounts/Accounts.css';

const PAGE_SIZE = 50;

/**
 * Global Tags — /tags. Raw operational view across every tagged object in
 * the current tenant, paginated straight from the backend. Not meant to be
 * pretty — it's for finding "what's tagged with what" across accounts.
 * Resolves tagDefinitionId to a human name by joining against the tag
 * definitions list client-side when available.
 */
export function GlobalTags() {
  const [page, setPage] = useState(0);
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [definitions, setDefinitions] = useState<TagDefinitionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([listGlobalTags(page, PAGE_SIZE), listAllTagDefinitions().catch(() => [])])
      .then(([tagsResult, defs]) => {
        if (cancelled) return;
        setTags(tagsResult.tags);
        setTotalCount(tagsResult.totalCount);
        setDefinitions(defs);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load tags.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  const nameFor = (tagDefinitionId: string) =>
    definitions.find((d) => d.id === tagDefinitionId)?.name || null;

  return (
    <div className="accounts-page">
      <div className="accounts-page__header">
        <h1>Global Tags</h1>
      </div>

      {loading && <p>Loading tags…</p>}
      {error && <div className="accounts-error">{error}</div>}

      {!loading && !error && (
        <>
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Object Type</th>
                <th>Object ID</th>
                <th>Tag Definition</th>
              </tr>
            </thead>
            <tbody>
              {tags.length === 0 && (
                <tr>
                  <td colSpan={3} className="accounts-table__empty">
                    No tags found.
                  </td>
                </tr>
              )}
              {tags.map((t) => {
                const resolvedName = nameFor(t.tagDefinitionId);
                return (
                  <tr key={t.tagId}>
                    <td>{t.objectType}</td>
                    <td className="accounts-code-cell">{t.objectId}</td>
                    <td>
                      {resolvedName ? (
                        resolvedName
                      ) : (
                        <span className="accounts-code-cell">{t.tagDefinitionId}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination page={page} size={PAGE_SIZE} totalCount={totalCount} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
