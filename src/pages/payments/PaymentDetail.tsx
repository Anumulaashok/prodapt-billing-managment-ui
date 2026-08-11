/**
 * Payment detail page. Route intent: /payments/:paymentId.
 *
 * Shows the payment's amount/status (from PaymentController#get, GET
 * /1.0/kb/payments/{paymentId}) and its full transaction history (purchase /
 * refund / chargeback), and offers refund / chargeback actions since both
 * exist on the backend (PaymentController#refund, PaymentController#chargeback
 * -- POST /1.0/kb/payments/{paymentId}/refunds and .../chargebacks).
 *
 * Associated invoice: NOT shown. The backend links payments to invoices
 * internally (InvoicePayment entity / InvoicePaymentRepository), but no
 * controller anywhere exposes that link over HTTP -- there's no
 * `GET /invoices?paymentId=` or `invoiceId` field on PaymentResponse. So this
 * is genuinely unavailable from the API today and is marked Locked rather
 * than guessed at.
 */
import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { chargebackPayment, getPayment, refundPayment } from '../../api/payments';
import type { Payment } from '../../api/payments';
import { ApiError } from '../../api/client';
import { LockedBadge } from '../../components/Locked';
import './Payments.css';

function StatusBadge({ status }: { status: string }) {
  const cls = status.toLowerCase();
  return <span className={`payment-status payment-status--${cls}`}>{status}</span>;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatAmount(amount: number | null | undefined, currency: string | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return currency ? `${amount.toFixed(2)} ${currency}` : amount.toFixed(2);
}

type ActionMode = 'none' | 'refund' | 'chargeback';

export function PaymentDetail() {
  const { paymentId } = useParams<{ paymentId: string }>();

  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionMode, setActionMode] = useState<ActionMode>('none');
  const [actionAmount, setActionAmount] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!paymentId) return;
    setLoading(true);
    setError(null);
    getPayment(paymentId)
      .then(setPayment)
      .catch((err) => {
        setError(err instanceof ApiError ? `Failed to load payment: ${err.message}` : 'Failed to load payment.');
      })
      .finally(() => setLoading(false));
  }, [paymentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleActionSubmit(e: FormEvent) {
    e.preventDefault();
    if (!paymentId) return;
    setActionSubmitting(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const amount = actionAmount.trim() ? Number(actionAmount) : undefined;
      const updated =
        actionMode === 'refund'
          ? await refundPayment(paymentId, amount)
          : await chargebackPayment(paymentId, amount);
      setPayment(updated);
      setActionSuccess(actionMode === 'refund' ? 'Refund issued.' : 'Chargeback recorded.');
      setActionMode('none');
      setActionAmount('');
    } catch (err) {
      setActionError(
        err instanceof ApiError ? `Action failed: ${err.message}` : 'Action failed. Please try again.',
      );
    } finally {
      setActionSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="payments-card">
        <div className="payments-loading">Loading payment…</div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="payments-card">
        <div className="payments-error">{error ?? 'Payment not found.'}</div>
      </div>
    );
  }

  const purchaseTxn = payment.transactions.find((t) => t.transactionType === 'PURCHASE');
  const totalAmount = purchaseTxn?.amount ?? payment.transactions[0]?.amount ?? null;
  const currency = purchaseTxn?.currency ?? payment.transactions[0]?.currency ?? null;

  return (
    <div>
      <div className="payments-header">
        <h1>Payment</h1>
        <Link to={`/accounts/${payment.accountId}`} className="payments-btn payments-btn--secondary">
          View Account
        </Link>
      </div>

      <div className="payments-card">
        <div className="payment-meta-grid">
          <div className="payment-meta-item">
            <span className="payment-meta-item__label">Payment ID</span>
            <span className="payment-meta-item__value payment-meta-item__value--mono">{payment.paymentId}</span>
          </div>
          <div className="payment-meta-item">
            <span className="payment-meta-item__label">Amount</span>
            <span className="payment-meta-item__value">{formatAmount(totalAmount, currency)}</span>
          </div>
          <div className="payment-meta-item">
            <span className="payment-meta-item__label">Status</span>
            <span className="payment-meta-item__value">
              <StatusBadge status={payment.stateName} />
            </span>
          </div>
          <div className="payment-meta-item">
            <span className="payment-meta-item__label">Payment Method</span>
            <span className="payment-meta-item__value payment-meta-item__value--mono">
              {payment.paymentMethodId}
            </span>
          </div>
          <div className="payment-meta-item">
            <span className="payment-meta-item__label">
              Associated Invoice <LockedBadge tooltip="Not exposed by the backend API — payments aren't linked to invoices over HTTP" />
            </span>
            <span className="payment-meta-item__value payments-muted">—</span>
          </div>
        </div>

        <div className="payments-actions">
          <button
            type="button"
            className="payments-btn payments-btn--secondary payments-btn--small"
            onClick={() => {
              setActionMode(actionMode === 'refund' ? 'none' : 'refund');
              setActionError(null);
              setActionSuccess(null);
            }}
          >
            Refund
          </button>
          <button
            type="button"
            className="payments-btn payments-btn--secondary payments-btn--small"
            onClick={() => {
              setActionMode(actionMode === 'chargeback' ? 'none' : 'chargeback');
              setActionError(null);
              setActionSuccess(null);
            }}
          >
            Chargeback
          </button>
        </div>

        {actionMode !== 'none' && (
          <form className="payments-inline-form" onSubmit={handleActionSubmit}>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount (optional — full amount if blank)"
              value={actionAmount}
              onChange={(e) => setActionAmount(e.target.value)}
            />
            <button type="submit" className="payments-btn payments-btn--small" disabled={actionSubmitting}>
              {actionSubmitting
                ? 'Submitting…'
                : actionMode === 'refund'
                  ? 'Confirm Refund'
                  : 'Confirm Chargeback'}
            </button>
            <button
              type="button"
              className="payments-btn payments-btn--secondary payments-btn--small"
              onClick={() => {
                setActionMode('none');
                setActionAmount('');
              }}
            >
              Cancel
            </button>
          </form>
        )}

        {actionError && <div className="payments-error">{actionError}</div>}
        {actionSuccess && <div className="payments-success">{actionSuccess}</div>}
      </div>

      <div className="payments-card">
        <div className="payments-header">
          <h2>Transaction History</h2>
        </div>
        {payment.transactions.length === 0 ? (
          <p className="payments-empty">No transactions recorded.</p>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {payment.transactions.map((txn) => (
                <tr key={txn.transactionId}>
                  <td>{txn.transactionType}</td>
                  <td>
                    <StatusBadge status={txn.status} />
                  </td>
                  <td className="payments-table__amount">{formatAmount(txn.amount, txn.currency)}</td>
                  <td>{formatDate(txn.effectiveDate)}</td>
                  <td className="payments-muted">
                    {txn.gatewayErrorCode || txn.gatewayErrorMessage
                      ? `${txn.gatewayErrorCode ?? ''} ${txn.gatewayErrorMessage ?? ''}`.trim()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
