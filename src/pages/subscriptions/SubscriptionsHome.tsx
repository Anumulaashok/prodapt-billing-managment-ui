import { useEffect, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getAccountByExternalKey, listAccounts } from '../../api/accounts';
import type { AccountResponse } from '../../api/accounts';
import { BundleList } from './BundleList';
import '../accounts/Accounts.css';
import './BundleList.css';
import './SubscriptionsHome.css';

/**
 * Subscriptions landing page — /subscriptions.
 *
 * The backend has no cross-account subscriptions list (a bundle only ever
 * exists under an account), so this page's job is to get the user to an
 * account fast: search by external key, or browse/pick from the account
 * list, then it renders that account's live subscriptions inline via the
 * same <BundleList> used on the Account detail page — including its
 * existing "+ New subscription" action. The picked account stays in the
 * URL (?accountId=...) so this page is linkable/bookmarkable and survives
 * a refresh.
 */
export function SubscriptionsHome() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAccountId = searchParams.get('accountId');

  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchKey, setSearchKey] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listAccounts(true)
      .then((data) => {
        if (!cancelled) setAccounts(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Unable to load accounts.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedAccount = accounts.find((a) => a.accountId === selectedAccountId) ?? null;

  function selectAccount(accountId: string) {
    setSearchParams({ accountId });
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchKey.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const account = await getAccountByExternalKey(searchKey.trim());
      selectAccount(account.accountId);
      setSearchKey('');
    } catch (err) {
      setSearchError(
        err instanceof ApiError && err.status === 404
          ? `No account found with external key "${searchKey.trim()}".`
          : 'Search failed. Please try again.',
      );
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="subscriptions-page">
      <div className="subscriptions-page__header">
        <h1>Subscriptions</h1>
        <p className="subscriptions-page__subtitle">
          Subscriptions live under an account. Pick one below to view, create, pause, or resume its subscriptions.
        </p>
      </div>

      <form className="accounts-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Jump to account by external key…"
          value={searchKey}
          onChange={(e) => setSearchKey(e.target.value)}
        />
        <button type="submit" className="accounts-btn" disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {searchError && <div className="accounts-error">{searchError}</div>}

      <div className="subscriptions-page__layout">
        <div className="subscriptions-page__account-list">
          <h3 className="subscriptions-page__section-title">Accounts</h3>
          {loading && <p className="bundle-list__hint">Loading accounts…</p>}
          {loadError && <p className="bundle-list__error">{loadError}</p>}
          {!loading && !loadError && accounts.length === 0 && (
            <p className="bundle-list__hint">No accounts yet — create one first.</p>
          )}
          {!loading && !loadError && (
            <ul className="subscriptions-page__account-items">
              {accounts.map((account) => (
                <li key={account.accountId}>
                  <button
                    type="button"
                    className={`subscriptions-page__account-item${
                      account.accountId === selectedAccountId ? ' subscriptions-page__account-item--active' : ''
                    }`}
                    onClick={() => selectAccount(account.accountId)}
                  >
                    <span className="subscriptions-page__account-name">
                      {account.name || account.externalKey}
                    </span>
                    <span className="subscriptions-page__account-key">{account.externalKey}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="subscriptions-page__detail">
          {selectedAccount ? (
            <>
              <div className="subscriptions-page__detail-header">
                <span className="subscriptions-page__detail-title">
                  {selectedAccount.name || selectedAccount.externalKey}
                </span>
                <a className="subscriptions-page__detail-link" href={`/accounts/${selectedAccount.accountId}`}>
                  View full account →
                </a>
              </div>
              <BundleList accountId={selectedAccount.accountId} />
            </>
          ) : (
            <div className="subscriptions-page__empty-state">
              <p>Select an account on the left (or search by external key above) to see its subscriptions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
