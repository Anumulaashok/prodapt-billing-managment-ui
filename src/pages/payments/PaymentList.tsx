/**
 * Payment list widget. Given an `accountId`, lists that account's payments.
 *
 * There is no dedicated `GET /accounts/{accountId}/payments` endpoint on the
 * backend (AccountPaymentController only exposes POST for purchase / pay
 * invoice) — payments for an account are sourced from the timeline endpoint
 * instead (GET /1.0/kb/accounts/{accountId}/timeline), same as
 * AccountTimelineController does for KAUI's account detail page. See
 * src/api/payments.ts#listPaymentsForAccount.
 *
 * Also usable as a standalone page (e.g. mounted at /payments with no
 * account context): there is no global "list all payments for browsing"
 * endpoint either (PaymentController#listPaginated is a tenant-wide
 * pagination endpoint, not meant for this), so with no accountId this
 * renders a "select an account" prompt — mirrors InvoiceList's pattern.
 *
 * Date/amount/currency are read off each payment's PURCHASE transaction
 * (falling back to the first transaction) since Payment itself carries no
 * date/amount fields — only its transactions do.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listPaymentsForAccount } from '../../api/payments';
import type { Payment, PaymentTransaction } from '../../api/payments';
import { ApiError } from '../../api/client';
import './Payments.css';

function StatusBadge({ status }: { status: string }) {
  const cls = status.toLowerCase();
  return <span className={`payment-status payment-status--${cls}`}>{status}</span>;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return currency ? `${amount.toFixed(2)} ${currency}` : amount.toFixed(2);
}

/** Picks the transaction that best represents "the payment" for summary display. */
function primaryTransaction(payment: Payment): PaymentTransaction | undefined {
  return (
    payment.transactions.find((t) => t.transactionType === 'PURCHASE') ?? payment.transactions[0]
  );
}

export interface PaymentListProps {
  /** Account to list payments for. Omit to render a "select an account" prompt. */
  accountId?: string;
  /** Optional heading override. */
  title?: string;
}

export function PaymentList({ accountId, title = 'Payments' }: PaymentListProps) {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!accountId) {
      setPayments(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listPaymentsForAccount(accountId)
      .then((data) => {
        if (!cancelled) setPayments(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? `Failed to load payments: ${err.message}` : 'Failed to load payments.');
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
      <div className="payments-card">
        <div className="payments-header">
          <h2>{title}</h2>
        </div>
        <p className="payments-empty">Select an account to view its payments.</p>
      </div>
    );
  }

  return (
    <div className="payments-card">
      <div className="payments-header">
        <h2>{title}</h2>
      </div>

      {error && <div className="payments-error">{error}</div>}
      {loading && <div className="payments-loading">Loading payments…</div>}

      {!loading && !error && payments && payments.length === 0 && (
        <p className="payments-empty">No payments for this account yet.</p>
      )}

      {!loading && !error && payments && payments.length > 0 && (
        <table className="payments-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment Method</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const primary = primaryTransaction(payment);
              return (
                <tr key={payment.paymentId} className="payments-table__row--clickable">
                  <td>
                    <Link to={`/payments/${payment.paymentId}`}>{formatDate(primary?.effectiveDate)}</Link>
                  </td>
                  <td className="payments-table__amount">{formatAmount(primary?.amount, primary?.currency)}</td>
                  <td>
                    <StatusBadge status={payment.stateName} />
                  </td>
                  <td className="payment-meta-item__value--mono">{payment.paymentMethodId}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
