import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listBundlesForAccount } from '../../api/subscriptions';
import type { BundleResponse } from '../../api/subscriptions';
import { ApiError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { LockedBadge } from '../../components/Locked';
import './BundleList.css';

/**
 * Self-contained, reusable list of bundles for a given account. Meant to be dropped
 * into the Accounts detail page's "Bundles" tab: <BundleList accountId={accountId} />.
 *
 * Backed by GET /1.0/kb/accounts/{accountId}/bundles (AccountBundleController).
 */
export function BundleList({ accountId }: { accountId: string }) {
  const [bundles, setBundles] = useState<BundleResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();
  const canCreateSubscription = hasPermission('subscription:create');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    listBundlesForAccount(accountId)
      .then((data) => {
        if (!cancelled) setBundles(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? `Failed to load bundles: ${err.message}` : 'Failed to load bundles.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  return (
    <div className="bundle-list">
      <div className="bundle-list__header">
        <h3 className="bundle-list__title">Bundles</h3>
        {canCreateSubscription ? (
          <Link to={`/accounts/${accountId}/subscriptions/new`} className="bundle-list__new-link">
            + New subscription
          </Link>
        ) : (
          <span className="bundle-list__new-link" aria-disabled="true" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
            + New subscription
            <LockedBadge tooltip="You don't have permission to do this" />
          </span>
        )}
      </div>

      {loading && <p className="bundle-list__hint">Loading bundles…</p>}
      {error && <p className="bundle-list__error">{error}</p>}

      {!loading && !error && bundles && bundles.length === 0 && (
        <p className="bundle-list__hint">No bundles yet for this account.</p>
      )}

      {!loading && !error && bundles && bundles.length > 0 && (
        <ul className="bundle-list__items">
          {bundles.map((bundle) => (
            <li key={bundle.bundleId} className="bundle-list__item">
              <Link to={`/accounts/${accountId}/bundles/${bundle.bundleId}`} className="bundle-list__item-link">
                <span className="bundle-list__item-key">{bundle.externalKey}</span>
                <span className="bundle-list__item-id">{bundle.bundleId}</span>
              </Link>
              <span
                className={`bundle-list__status ${bundle.isBlocked ? 'bundle-list__status--paused' : 'bundle-list__status--active'}`}
              >
                {bundle.isBlocked ? 'Paused' : 'Active'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
