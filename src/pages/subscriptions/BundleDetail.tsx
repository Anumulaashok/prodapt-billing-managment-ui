import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getBundle, getPlans, pauseBundle, resumeBundle } from '../../api/subscriptions';
import type { BundleResponse, Plan } from '../../api/subscriptions';
import { LockedBadge } from '../../components/Locked';
import { useAuth } from '../../context/AuthContext';
import './BundleList.css';

/**
 * Bundle detail page — /accounts/:accountId/bundles/:bundleId.
 *
 * NOTE: the backend has no endpoint to list the subscription(s) belonging to
 * a bundleId (SubscriptionController only supports get-by-subscriptionId,
 * and bundle<->subscription linkage isn't exposed). This page therefore
 * shows the bundle-level fields (external key, paused/active state) plus
 * pause/resume actions, and marks plan-change/cancel as locked since those
 * require a specific subscriptionId this page has no way to discover.
 */
export function BundleDetail() {
  const { accountId, bundleId } = useParams<{ accountId: string; bundleId: string }>();
  const [bundle, setBundle] = useState<BundleResponse | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);
  const { hasPermission } = useAuth();
  const canPauseResume = hasPermission('entitlement:pause_resume');

  function reload() {
    if (!bundleId) return;
    setLoading(true);
    setError(null);
    getBundle(bundleId)
      .then(setBundle)
      .catch(() => setError('Unable to load bundle.'))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [bundleId]);
  useEffect(() => {
    getPlans()
      .then(setPlans)
      .catch(() => undefined);
  }, []);

  async function handlePauseResume() {
    if (!bundleId || !bundle) return;
    setActionPending(true);
    setActionError(null);
    try {
      const updated = bundle.isBlocked ? await resumeBundle(bundleId) : await pauseBundle(bundleId);
      setBundle(updated);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setActionPending(false);
    }
  }

  if (!accountId || !bundleId) return null;
  if (loading) return <p>Loading bundle…</p>;
  if (error) return <div className="bundle-list__error">{error}</div>;
  if (!bundle) return null;

  return (
    <div className="bundle-detail">
      <div className="bundle-list__header">
        <h1>{bundle.externalKey}</h1>
      </div>
      <p className="bundle-list__hint">Bundle ID: {bundle.bundleId}</p>
      <p>
        Status:{' '}
        <span
          className={`bundle-list__status ${bundle.isBlocked ? 'bundle-list__status--paused' : 'bundle-list__status--active'}`}
        >
          {bundle.isBlocked ? 'Paused' : 'Active'}
        </span>
      </p>
      {bundle.pausedDate && <p className="bundle-list__hint">Paused since {bundle.pausedDate}</p>}

      {actionError && <div className="bundle-list__error">{actionError}</div>}

      <div className="bundle-detail__actions">
        {canPauseResume ? (
          <button className="bundle-detail__action-btn" onClick={handlePauseResume} disabled={actionPending}>
            {bundle.isBlocked ? 'Resume' : 'Pause'}
          </button>
        ) : (
          <span className="bundle-detail__locked-action">
            {bundle.isBlocked ? 'Resume' : 'Pause'}
            <LockedBadge tooltip="You don't have permission to do this" />
          </span>
        )}
        <span className="bundle-detail__locked-action">
          Change plan
          <LockedBadge tooltip="Requires a subscription ID, which isn't linkable from a bundle in the current backend API." />
        </span>
        <span className="bundle-detail__locked-action">
          Cancel subscription
          <LockedBadge tooltip="Requires a subscription ID, which isn't linkable from a bundle in the current backend API." />
        </span>
      </div>

      {plans.length > 0 && (
        <p className="bundle-list__hint" style={{ marginTop: '1.5rem' }}>
          {plans.length} plan(s) available in the catalog for new subscriptions on this account.
        </p>
      )}
    </div>
  );
}
