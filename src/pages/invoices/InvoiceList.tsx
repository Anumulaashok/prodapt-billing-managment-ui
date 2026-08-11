/**
 * Invoice list widget. Given an `accountId`, lists that account's invoices
 * via AccountInvoiceController#list (GET /1.0/kb/accounts/{accountId}/invoices).
 *
 * Note on columns: the backend's InvoiceSummaryResponse only carries
 * invoiceId/invoiceDate/targetDate/currency/status — there is no amount or
 * balance field on the summary shape, and no per-invoice balance concept
 * exists anywhere in the backend (only an account-level aggregate balance
 * via AccountBalanceService). So this list shows date/currency/status; the
 * invoice's total amount is only available on the detail page (full
 * InvoiceResponse, fetched per-invoice), which is why each row links there.
 *
 * Also usable as a standalone page (e.g. mounted at /invoices with no
 * account context) since there is no global "list all invoices" endpoint
 * meant for browsing — InvoiceController#listPaginated is a tenant-wide
 * pagination endpoint, not intended for this kind of view. When no
 * `accountId` is supplied, this renders a prompt instead of calling
 * anything.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listAccountInvoices } from '../../api/invoices';
import type { InvoiceSummary } from '../../api/invoices';
import { ApiError } from '../../api/client';
import './Invoices.css';

function StatusBadge({ status }: { status: string }) {
  const cls = status.toLowerCase();
  return <span className={`invoice-status invoice-status--${cls}`}>{status}</span>;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

export interface InvoiceListProps {
  /** Account to list invoices for. Omit to render a "select an account" prompt. */
  accountId?: string;
  /** Optional heading override. */
  title?: string;
}

export function InvoiceList({ accountId, title = 'Invoices' }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<InvoiceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setInvoices(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listAccountInvoices(accountId)
      .then((data) => {
        if (!cancelled) setInvoices(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? `Failed to load invoices: ${err.message}` : 'Failed to load invoices.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (!accountId) {
    return (
      <div className="invoices-card">
        <div className="invoices-header">
          <h2>{title}</h2>
        </div>
        <p className="invoices-empty">Select an account to view its invoices.</p>
      </div>
    );
  }

  return (
    <div className="invoices-card">
      <div className="invoices-header">
        <h2>{title}</h2>
      </div>

      {error && <div className="invoices-error">{error}</div>}
      {loading && <div className="invoices-loading">Loading invoices…</div>}

      {!loading && !error && invoices && invoices.length === 0 && (
        <p className="invoices-empty">No invoices for this account yet.</p>
      )}

      {!loading && !error && invoices && invoices.length > 0 && (
        <table className="invoices-table">
          <thead>
            <tr>
              <th>Invoice Date</th>
              <th>Target Date</th>
              <th>Currency</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.invoiceId} className="invoices-table__row--clickable">
                <td>
                  <Link to={`/invoices/${inv.invoiceId}`}>{formatDate(inv.invoiceDate)}</Link>
                </td>
                <td>{formatDate(inv.targetDate)}</td>
                <td>{inv.currency}</td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
