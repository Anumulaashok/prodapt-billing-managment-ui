/**
 * "Make a payment" form for an account. Supports the two ways the backend
 * can trigger a payment:
 *
 *   - Purchase: POST /1.0/kb/accounts/{accountId}/payments
 *     body: PurchasePaymentRequest { paymentMethodId, amount, currency, paymentExternalKey? }
 *     (AccountPaymentController#purchase)
 *
 *   - Pay Invoice: POST /1.0/kb/accounts/{accountId}/invoices/{invoiceId}/payments
 *     (no body -- amount/currency are derived server-side from the invoice)
 *     (AccountPaymentController#payInvoice)
 *
 * The payment method list is loaded from listPaymentMethods so the purchase
 * form can offer a select instead of asking for a raw ID.
 */
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { listPaymentMethods, payInvoice, purchasePayment } from '../../api/payments';
import type { Payment, PaymentMethod } from '../../api/payments';
import { ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { LockedBadge } from '../../components/Locked';
import './Payments.css';

type Mode = 'purchase' | 'invoice';

export interface MakePaymentProps {
  accountId: string;
  title?: string;
}

export function MakePayment({ accountId, title = 'Make a Payment' }: MakePaymentProps) {
  const [mode, setMode] = useState<Mode>('purchase');

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [externalKey, setExternalKey] = useState('');

  const [invoiceId, setInvoiceId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Payment | null>(null);
  const { hasPermission } = useAuth();
  const canTriggerPayment = hasPermission('payment:trigger_payment');

  useEffect(() => {
    listPaymentMethods(accountId)
      .then((data) => {
        setMethods(data);
        if (data.length > 0) setPaymentMethodId(data[0].paymentMethodId);
      })
      .catch(() => setMethodsError('Unable to load payment methods for this account.'));
  }, [accountId]);

  async function handlePurchaseSubmit(e: FormEvent) {
    e.preventDefault();
    if (!paymentMethodId || !amount.trim() || !currency.trim()) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const payment = await purchasePayment(accountId, {
        paymentMethodId,
        amount: Number(amount),
        currency: currency.trim(),
        paymentExternalKey: externalKey.trim() || undefined,
      });
      setResult(payment);
      setAmount('');
      setExternalKey('');
    } catch (err) {
      setError(err instanceof ApiError ? `Payment failed: ${err.message}` : 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInvoiceSubmit(e: FormEvent) {
    e.preventDefault();
    if (!invoiceId.trim()) return;
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const payment = await payInvoice(accountId, invoiceId.trim());
      setResult(payment);
      setInvoiceId('');
    } catch (err) {
      setError(err instanceof ApiError ? `Payment failed: ${err.message}` : 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="payments-card">
      <div className="payments-header">
        <h2>{title}</h2>
      </div>

      <div className="payments-mode-toggle">
        <button
          type="button"
          className={mode === 'purchase' ? 'payments-mode-toggle__btn--active' : ''}
          onClick={() => setMode('purchase')}
        >
          Purchase
        </button>
        <button
          type="button"
          className={mode === 'invoice' ? 'payments-mode-toggle__btn--active' : ''}
          onClick={() => setMode('invoice')}
        >
          Pay an Invoice
        </button>
      </div>

      {methodsError && <div className="payments-error">{methodsError}</div>}

      {mode === 'purchase' ? (
        <form className="payments-form" onSubmit={handlePurchaseSubmit}>
          <div className="payments-form__field">
            <label htmlFor="mp-payment-method">Payment Method</label>
            {methods.length > 0 ? (
              <select
                id="mp-payment-method"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                required
              >
                {methods.map((m) => (
                  <option key={m.paymentMethodId} value={m.paymentMethodId}>
                    {m.pluginName} ({m.paymentMethodId})
                  </option>
                ))}
              </select>
            ) : (
              <p className="payments-empty">
                No payment methods on file. Add one below before making a payment.
              </p>
            )}
          </div>

          <div className="payments-form__row">
            <div className="payments-form__field">
              <label htmlFor="mp-amount">Amount</label>
              <input
                id="mp-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="payments-form__field">
              <label htmlFor="mp-currency">Currency</label>
              <input
                id="mp-currency"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                maxLength={3}
                required
              />
            </div>
          </div>

          <div className="payments-form__field">
            <label htmlFor="mp-external-key">Payment External Key (optional)</label>
            <input
              id="mp-external-key"
              type="text"
              value={externalKey}
              onChange={(e) => setExternalKey(e.target.value)}
            />
          </div>

          {error && <div className="payments-error">{error}</div>}
          {result && (
            <div className="payments-success">
              Payment <Link to={`/payments/${result.paymentId}`}>{result.paymentId}</Link> created — status{' '}
              {result.stateName}.
            </div>
          )}

          <div className="payments-actions">
            {canTriggerPayment ? (
              <button type="submit" className="payments-btn" disabled={submitting || methods.length === 0}>
                {submitting ? 'Submitting…' : 'Make Payment'}
              </button>
            ) : (
              <span className="payments-btn" aria-disabled="true" style={{ opacity: 0.6, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Make Payment
                <LockedBadge tooltip="You don't have permission to do this" />
              </span>
            )}
          </div>
        </form>
      ) : (
        <form className="payments-form" onSubmit={handleInvoiceSubmit}>
          <div className="payments-form__field">
            <label htmlFor="mp-invoice-id">Invoice ID</label>
            <input
              id="mp-invoice-id"
              type="text"
              placeholder="Invoice to pay"
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              required
            />
          </div>
          <p className="payments-note payments-muted">
            Pays the invoice in full using the account's default payment method, server-side.
          </p>

          {error && <div className="payments-error">{error}</div>}
          {result && (
            <div className="payments-success">
              Payment <Link to={`/payments/${result.paymentId}`}>{result.paymentId}</Link> created — status{' '}
              {result.stateName}.
            </div>
          )}

          <div className="payments-actions">
            {canTriggerPayment ? (
              <button type="submit" className="payments-btn" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Pay Invoice'}
              </button>
            ) : (
              <span className="payments-btn" aria-disabled="true" style={{ opacity: 0.6, cursor: 'not-allowed', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Pay Invoice
                <LockedBadge tooltip="You don't have permission to do this" />
              </span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
