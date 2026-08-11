/**
 * Invoice detail page. Route intent: /invoices/:invoiceId
 *
 * Sourced from InvoiceController (GET /1.0/kb/invoices/{invoiceId}), whose
 * InvoiceResponse carries invoiceId/accountId/invoiceDate/targetDate/
 * currency/status/amount/items. There is no separate "balance" field on an
 * invoice in this backend (no per-invoice balance tracking exists at all —
 * only an account-level aggregate balance elsewhere) so only the total
 * `amount` is shown.
 *
 * Item-level adjustment IS supported by the backend
 * (PUT /1.0/kb/invoices/{invoiceId}/items/{itemId}, InvoiceItemAdjustmentRequest
 * { amount, description }), so each line item gets an "Adjust" action.
 *
 * Adding an external charge to the invoice is also supported
 * (POST /1.0/kb/invoices/{invoiceId}/charges, ExternalChargeRequest
 * { amount, description }) and is included here as a small self-contained
 * form, since it's a natural invoice-level action alongside adjustments.
 */
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getInvoice,
  adjustInvoiceItem,
  addExternalCharge,
} from '../../api/invoices';
import type { InvoiceDetail as InvoiceDetailData, InvoiceItem } from '../../api/invoices';
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

function formatAmount(value: string | null | undefined, currency: string): string {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return `${value} ${currency}`;
  return `${n.toFixed(2)} ${currency}`;
}

function AdjustItemForm({
  invoiceId,
  item,
  onAdjusted,
}: {
  invoiceId: string;
  item: InvoiceItem;
  onAdjusted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    setError(null);
    try {
      await adjustInvoiceItem(invoiceId, item.invoiceItemId, {
        amount,
        description: description || undefined,
      });
      setOpen(false);
      setAmount('');
      setDescription('');
      onAdjusted();
    } catch (err) {
      setError(err instanceof ApiError ? `Adjustment failed: ${err.message}` : 'Adjustment failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className="invoices-btn invoices-btn--secondary invoices-btn--small" onClick={() => setOpen(true)}>
        Adjust
      </button>
    );
  }

  return (
    <div>
      <form className="invoice-adjust-form" onSubmit={handleSubmit}>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className="invoices-btn invoices-btn--small" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="invoices-btn invoices-btn--secondary invoices-btn--small"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          Cancel
        </button>
      </form>
      {error && <div className="invoices-error">{error}</div>}
    </div>
  );
}

function ExternalChargeForm({ invoiceId, onAdded }: { invoiceId: string; onAdded: () => void }) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await addExternalCharge(invoiceId, { amount, description: description || undefined });
      setAmount('');
      setDescription('');
      setSuccess(true);
      onAdded();
    } catch (err) {
      setError(err instanceof ApiError ? `Failed to add charge: ${err.message}` : 'Failed to add charge.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="invoices-card">
      <h2>Add External Charge</h2>
      <form className="invoices-inline-form" onSubmit={handleSubmit}>
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit" className="invoices-btn" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Charge'}
        </button>
      </form>
      {error && <div className="invoices-error">{error}</div>}
      {success && <div className="invoices-success">Charge added.</div>}
    </div>
  );
}

export function InvoiceDetail() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<InvoiceDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!invoiceId) return;
    setLoading(true);
    setError(null);
    getInvoice(invoiceId)
      .then(setInvoice)
      .catch((err) => {
        setError(err instanceof ApiError ? `Failed to load invoice: ${err.message}` : 'Failed to load invoice.');
      })
      .finally(() => setLoading(false));
  }, [invoiceId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!invoiceId) {
    return (
      <div className="invoices-card">
        <p className="invoices-empty">No invoice specified.</p>
      </div>
    );
  }

  if (loading && !invoice) {
    return (
      <div className="invoices-card">
        <div className="invoices-loading">Loading invoice…</div>
      </div>
    );
  }

  if (error && !invoice) {
    return (
      <div className="invoices-card">
        <div className="invoices-error">{error}</div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div>
      <div className="invoices-card">
        <div className="invoices-header">
          <h1>Invoice {invoice.invoiceId}</h1>
          <StatusBadge status={invoice.status} />
        </div>

        {error && <div className="invoices-error">{error}</div>}

        <div className="invoice-meta-grid">
          <div className="invoice-meta-item">
            <span className="invoice-meta-item__label">Account</span>
            <span className="invoice-meta-item__value">{invoice.accountId}</span>
          </div>
          <div className="invoice-meta-item">
            <span className="invoice-meta-item__label">Invoice Date</span>
            <span className="invoice-meta-item__value">{formatDate(invoice.invoiceDate)}</span>
          </div>
          <div className="invoice-meta-item">
            <span className="invoice-meta-item__label">Target Date</span>
            <span className="invoice-meta-item__value">{formatDate(invoice.targetDate)}</span>
          </div>
          <div className="invoice-meta-item">
            <span className="invoice-meta-item__label">Currency</span>
            <span className="invoice-meta-item__value">{invoice.currency}</span>
          </div>
        </div>

        <table className="invoices-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.length === 0 && (
              <tr>
                <td colSpan={6} className="invoices-empty">
                  No line items on this invoice.
                </td>
              </tr>
            )}
            {invoice.items.map((item) => (
              <tr key={item.invoiceItemId}>
                <td>{item.description || item.planName || item.type}</td>
                <td>{item.type}</td>
                <td>{formatDate(item.startDate)}</td>
                <td>{formatDate(item.endDate)}</td>
                <td className="invoices-table__amount">{formatAmount(item.amount, item.currency)}</td>
                <td>
                  <AdjustItemForm invoiceId={invoice.invoiceId} item={item} onAdjusted={load} />
                </td>
              </tr>
            ))}
            <tr className="invoice-total-row">
              <td colSpan={4}>Total</td>
              <td className="invoices-table__amount">{formatAmount(invoice.amount, invoice.currency)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      <ExternalChargeForm invoiceId={invoice.invoiceId} onAdded={load} />
    </div>
  );
}
