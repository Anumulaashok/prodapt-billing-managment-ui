import { useEffect, useState } from 'react';
import { listAccountAuditLogs } from '../../api/audit';
import type { AuditLogResponse } from '../../api/audit';
import '../accounts/Accounts.css';

/**
 * Audit Log — dropped into AccountDetail's "Audit Log" tab. The backend
 * only exposes audit logs scoped to an account (no cross-account endpoint),
 * so this is a component taking an accountId prop rather than a standalone
 * route.
 */
export function AuditLog({ accountId }: { accountId: string }) {
  const [logs, setLogs] = useState<AuditLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listAccountAuditLogs(accountId)
      .then((result) => {
        if (!cancelled) setLogs(result.auditLogs);
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load audit logs.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (loading) return <p>Loading audit logs…</p>;
  if (error) return <div className="accounts-error">{error}</div>;

  return (
    <table className="accounts-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Table</th>
          <th>Change Type</th>
          <th>Created By</th>
          <th>Comments</th>
        </tr>
      </thead>
      <tbody>
        {logs.length === 0 && (
          <tr>
            <td colSpan={5} className="accounts-table__empty">
              No audit log entries found.
            </td>
          </tr>
        )}
        {logs.map((log) => (
          <tr key={log.auditLogId}>
            <td>{log.createdDate || <span className="accounts-muted">—</span>}</td>
            <td>{log.tableName}</td>
            <td>{log.changeType}</td>
            <td>{log.createdBy || <span className="accounts-muted">—</span>}</td>
            <td>{log.comments || <span className="accounts-muted">—</span>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
