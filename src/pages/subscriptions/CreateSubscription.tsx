import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { createSubscription, getPlans } from '../../api/subscriptions';
import type { Plan } from '../../api/subscriptions';
import './BundleList.css';

/**
 * Create-subscription page — /accounts/:accountId/subscriptions/new.
 * Populates the plan dropdown from the catalog, then POSTs to
 * /1.0/kb/subscriptions to create the subscription (and its bundle).
 */
export function CreateSubscription() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();

  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansError, setPlansError] = useState<string | null>(null);
  const [planName, setPlanName] = useState('');
  const [externalKey, setExternalKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => setPlansError('Unable to load catalog plans.'));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!accountId || !planName) return;
    setSubmitting(true);
    setError(null);
    try {
      const subscription = await createSubscription({
        accountId,
        planName,
        bundleExternalKey: externalKey.trim() || undefined,
      });
      navigate(`/accounts/${accountId}/bundles/${subscription.bundleId}`);
    } catch (err) {
      setError(err instanceof ApiError ? `Failed to create subscription: ${err.message}` : 'Failed to create subscription.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!accountId) return null;

  return (
    <div className="bundle-list" style={{ maxWidth: 480 }}>
      <h1 className="bundle-list__title">New Subscription</h1>

      {plansError && <div className="bundle-list__error">{plansError}</div>}
      {error && <div className="bundle-list__error">{error}</div>}

      <form onSubmit={handleSubmit} style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--prodapt-text-muted)' }}>
          Plan
          <select
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            required
            style={{ padding: '0.5rem 0.65rem', borderRadius: 'var(--prodapt-radius)', border: '1px solid var(--prodapt-border)' }}
          >
            <option value="">Select a plan…</option>
            {plans.map((plan) => (
              <option key={plan.name} value={plan.name}>
                {plan.name} ({plan.product})
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--prodapt-text-muted)' }}>
          Bundle External Key (optional)
          <input
            value={externalKey}
            onChange={(e) => setExternalKey(e.target.value)}
            placeholder="Auto-generated if left blank"
            style={{ padding: '0.5rem 0.65rem', borderRadius: 'var(--prodapt-radius)', border: '1px solid var(--prodapt-border)' }}
          />
        </label>

        <div>
          <button type="submit" className="bundle-detail__action-btn" disabled={submitting || !planName}>
            {submitting ? 'Creating…' : 'Create Subscription'}
          </button>
        </div>
      </form>
    </div>
  );
}
