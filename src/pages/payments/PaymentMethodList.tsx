/**
 * Payment methods widget. Given an `accountId`, lists that account's payment
 * methods (GET /1.0/kb/accounts/{accountId}/paymentMethods) with delete
 * (DELETE /1.0/kb/paymentMethods/{paymentMethodId}) and set-default
 * (PUT /1.0/kb/paymentMethods/{paymentMethodId}/setDefault) actions, plus an
 * inline "Add payment method" form (see AddPaymentMethod.tsx).
 *
 * Note: the backend does not track which payment method is "the default"
 * anywhere retrievable — PaymentMethod carries no isDefault flag, and
 * AccountResponse carries no defaultPaymentMethodId field either (the
 * concept only exists as a write-only action via setDefault). So this list
 * cannot mark a row as "current default"; the "Set Default" action is
 * offered but is fire-and-forget from the UI's perspective.
 */
import { useCallback, useEffect, useState } from 'react';
import { deletePaymentMethod, listPaymentMethods, setDefaultPaymentMethod } from '../../api/payments';
import type { PaymentMethod } from '../../api/payments';
import { ApiError } from '../../api/client';
import { AddPaymentMethod } from './AddPaymentMethod';
import './Payments.css';

export interface PaymentMethodListProps {
  accountId: string;
  title?: string;
}

export function PaymentMethodList({ accountId, title = 'Payment Methods' }: PaymentMethodListProps) {
  const [methods, setMethods] = useState<PaymentMethod[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [rowBusyId, setRowBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    listPaymentMethods(accountId)
      .then(setMethods)
      .catch((err) => {
        setError(
          err instanceof ApiError ? `Failed to load payment methods: ${err.message}` : 'Failed to load payment methods.',
        );
      })
      .finally(() => setLoading(false));
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(paymentMethodId: string) {
    setRowError(null);
    setRowBusyId(paymentMethodId);
    try {
      await deletePaymentMethod(paymentMethodId);
      load();
    } catch (err) {
      setRowError(err instanceof ApiError ? `Failed to delete: ${err.message}` : 'Failed to delete payment method.');
    } finally {
      setRowBusyId(null);
    }
  }

  async function handleSetDefault(paymentMethodId: string) {
    setRowError(null);
    setRowBusyId(paymentMethodId);
    try {
      await setDefaultPaymentMethod(paymentMethodId, accountId);
    } catch (err) {
      setRowError(
        err instanceof ApiError ? `Failed to set default: ${err.message}` : 'Failed to set default payment method.',
      );
    } finally {
      setRowBusyId(null);
    }
  }

  return (
    <div className="payments-card">
      <div className="payments-header">
        <h2>{title}</h2>
        <button type="button" className="payments-btn payments-btn--small" onClick={() => setShowAddForm((v) => !v)}>
          {showAddForm ? 'Close' : 'Add Payment Method'}
        </button>
      </div>

      {showAddForm && (
        <AddPaymentMethod
          accountId={accountId}
          onCancel={() => setShowAddForm(false)}
          onCreated={() => {
            setShowAddForm(false);
            load();
          }}
        />
      )}

      {error && <div className="payments-error">{error}</div>}
      {rowError && <div className="payments-error">{rowError}</div>}
      {loading && <div className="payments-loading">Loading payment methods…</div>}

      {!loading && !error && methods && methods.length === 0 && (
        <p className="payments-empty">No payment methods on file for this account.</p>
      )}

      {!loading && !error && methods && methods.length > 0 && (
        <table className="payments-table">
          <thead>
            <tr>
              <th>Plugin</th>
              <th>External Key</th>
              <th>Payment Method ID</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {methods.map((m) => (
              <tr key={m.paymentMethodId}>
                <td>{m.pluginName}</td>
                <td>{m.externalKey || <span className="payments-muted">—</span>}</td>
                <td className="payment-meta-item__value--mono">{m.paymentMethodId}</td>
                <td>
                  <div className="payments-actions">
                    <button
                      type="button"
                      className="payments-btn payments-btn--secondary payments-btn--small"
                      disabled={rowBusyId === m.paymentMethodId}
                      onClick={() => handleSetDefault(m.paymentMethodId)}
                    >
                      Set Default
                    </button>
                    <button
                      type="button"
                      className="payments-btn payments-btn--danger payments-btn--small"
                      disabled={rowBusyId === m.paymentMethodId}
                      onClick={() => handleDelete(m.paymentMethodId)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
