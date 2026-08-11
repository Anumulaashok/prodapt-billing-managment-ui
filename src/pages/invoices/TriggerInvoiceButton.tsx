/**
 * Self-contained "trigger invoice generation" control, meant to be embedded
 * on an account detail page (e.g. by the Accounts feature, built in
 * parallel) via `<TriggerInvoiceButton accountId={...} onSuccess={...} />`.
 *
 * Backend: POST /1.0/kb/accounts/{accountId}/invoices?targetDate=...
 * (AccountInvoiceController#generate). There's no background job driving
 * invoice generation automatically in this backend yet, so this is an
 * explicit "generate whatever's due as of targetDate" action. The backend
 * returns 201 with the invoice, or 204 No Content if nothing was due.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { triggerInvoice } from '../../api/invoices';
import type { InvoiceDetail } from '../../api/invoices';
import { ApiError } from '../../api/client';
import './Invoices.css';

export interface TriggerInvoiceButtonProps {
  accountId: string;
  /** Optional ISO-8601 target date/time. Defaults to "now" on the backend if omitted. */
  targetDate?: string;
  onSuccess?: (invoice: InvoiceDetail | null) => void;
  onError?: (error: unknown) => void;
}

export function TriggerInvoiceButton({ accountId, targetDate, onSuccess, onError }: TriggerInvoiceButtonProps) {
  const [customDate, setCustomDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<'generated' | 'nothing-due' | null>(null);

  async function handleTrigger(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const effectiveDate = targetDate ?? (customDate ? new Date(customDate).toISOString() : undefined);
      const invoice = await triggerInvoice(accountId, effectiveDate);
      setResult(invoice ? 'generated' : 'nothing-due');
      onSuccess?.(invoice);
    } catch (err) {
      const message = err instanceof ApiError ? `Invoice generation failed: ${err.message}` : 'Invoice generation failed.';
      setError(message);
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="invoices-inline-form" onSubmit={handleTrigger}>
      {targetDate === undefined && (
        <input
          type="date"
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          aria-label="Target date (defaults to today)"
        />
      )}
      <button type="submit" className="invoices-btn" disabled={submitting}>
        {submitting ? 'Generating…' : 'Trigger Invoice'}
      </button>
      {error && <span className="invoices-error">{error}</span>}
      {result === 'generated' && <span className="invoices-success">Invoice generated.</span>}
      {result === 'nothing-due' && <span className="invoices-note">Nothing due — no invoice generated.</span>}
    </form>
  );
}
