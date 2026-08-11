import { useEffect, useState } from 'react';
import { listQueues } from '../../api/queues';
import type { QueueEntryResponse } from '../../api/queues';
import { Pagination } from '../../components/Pagination';
import '../accounts/Accounts.css';

const PAGE_SIZE = 50;
const TRUNCATE_AT = 60;

/**
 * Notification Queue viewer — /queues. Read-only, paginated view of the
 * backend's persisted notification/bus queue entries. `eventJson` is shown
 * truncated with an expand-on-click toggle to see the full payload.
 */
export function Queues() {
  const [page, setPage] = useState(0);
  const [queues, setQueues] = useState<QueueEntryResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setExpanded(new Set());
    listQueues(page, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;
        setQueues(result.queues);
        setTotalCount(result.totalCount);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load the notification queue.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  function toggle(recordId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }
      return next;
    });
  }

  return (
    <div className="accounts-page">
      <div className="accounts-page__header">
        <h1>Notification Queues</h1>
      </div>

      {loading && <p>Loading queue entries…</p>}
      {error && <div className="accounts-error">{error}</div>}

      {!loading && !error && (
        <>
          <table className="accounts-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Class Name</th>
                <th>Creating Owner</th>
                <th>Processing State</th>
                <th>Error Count</th>
                <th>Event</th>
              </tr>
            </thead>
            <tbody>
              {queues.length === 0 && (
                <tr>
                  <td colSpan={6} className="accounts-table__empty">
                    No queue entries found.
                  </td>
                </tr>
              )}
              {queues.map((q) => {
                const isExpanded = expanded.has(q.recordId);
                const isLong = q.eventJson.length > TRUNCATE_AT;
                return (
                  <tr key={q.recordId}>
                    <td>{q.createdDate || <span className="accounts-muted">—</span>}</td>
                    <td className="accounts-code-cell">{q.className}</td>
                    <td>{q.creatingOwner || <span className="accounts-muted">—</span>}</td>
                    <td>{q.processingState || <span className="accounts-muted">—</span>}</td>
                    <td>{q.errorCount}</td>
                    <td>
                      {isExpanded ? (
                        <>
                          <pre className="accounts-json-pre">{q.eventJson}</pre>
                          <button className="accounts-json-toggle" onClick={() => toggle(q.recordId)}>
                            Collapse
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="accounts-code-cell">
                            {isLong ? `${q.eventJson.slice(0, TRUNCATE_AT)}…` : q.eventJson}
                          </span>
                          {isLong && (
                            <>
                              {' '}
                              <button className="accounts-json-toggle" onClick={() => toggle(q.recordId)}>
                                Expand
                              </button>
                            </>
                          )}
                        </>
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
