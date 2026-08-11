/**
 * "Add payment method" form. POSTs to
 * AccountPaymentController#createPaymentMethod:
 *   POST /1.0/kb/accounts/{accountId}/paymentMethods
 *   body: PaymentMethodRequest { pluginName: string (required), externalKey?: string }
 *
 * The backend's PaymentMethodRequest is deliberately minimal (this is a mock
 * payment plugin registry, not real card/bank tokenization — see
 * PaymentPluginRegistry / MockPaymentPluginApi) so this form only asks for
 * the two fields the DTO actually accepts. There is no card-number /
 * expiry / bank-account style field anywhere in the backend to build a form
 * around.
 */
import { useState } from 'react';
import type { FormEvent } from 'react';
import { createPaymentMethod } from '../../api/payments';
import type { PaymentMethod } from '../../api/payments';
import { ApiError } from '../../api/client';
import './Payments.css';

export interface AddPaymentMethodProps {
  accountId: string;
  onCreated?: (method: PaymentMethod) => void;
  onCancel?: () => void;
}

export function AddPaymentMethod({ accountId, onCreated, onCancel }: AddPaymentMethodProps) {
  const [pluginName, setPluginName] = useState('');
  const [externalKey, setExternalKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pluginName.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createPaymentMethod(accountId, {
        pluginName: pluginName.trim(),
        externalKey: externalKey.trim() || undefined,
      });
      setPluginName('');
      setExternalKey('');
      onCreated?.(created);
    } catch (err) {
      setError(
        err instanceof ApiError ? `Failed to add payment method: ${err.message}` : 'Failed to add payment method.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="payments-form" onSubmit={handleSubmit}>
      <div className="payments-form__field">
        <label htmlFor="pm-plugin-name">Plugin Name</label>
        <input
          id="pm-plugin-name"
          type="text"
          placeholder="e.g. mock-payment-plugin"
          value={pluginName}
          onChange={(e) => setPluginName(e.target.value)}
          required
        />
      </div>

      <div className="payments-form__field">
        <label htmlFor="pm-external-key">External Key (optional)</label>
        <input
          id="pm-external-key"
          type="text"
          value={externalKey}
          onChange={(e) => setExternalKey(e.target.value)}
        />
      </div>

      {error && <div className="payments-error">{error}</div>}

      <div className="payments-actions">
        <button type="submit" className="payments-btn" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Payment Method'}
        </button>
        {onCancel && (
          <button type="button" className="payments-btn payments-btn--secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
