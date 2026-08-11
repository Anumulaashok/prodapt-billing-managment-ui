import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getAccountByExternalKey, listAccounts } from '../../api/accounts';
import type { AccountResponse } from '../../api/accounts';
import './Accounts.css';

/**
 * Accounts list / search page.
 *
 * The backend exposes a real "list all accounts in tenant" endpoint
 * (GET /1.0/kb/accounts) as well as exact external-key lookup
 * (GET /1.0/kb/accounts?externalKey=...). This page uses the list as the
 * primary table and layers an external-key search box on top for quickly
 * jumping to a single account.
 */
export function AccountList() {
  const navigate = useNavigate();

  const [accounts, setAccounts] = useState<AccountResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchKey, setSearchKey] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
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

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchKey.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      const account = await getAccountByExternalKey(searchKey.trim());
      navigate(`/accounts/${account.accountId}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSearchError(`No account found with external key "${searchKey.trim()}".`);
      } else {
        setSearchError('Search failed. Please try again.');
      }
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="accounts-page">
      <div className="accounts-page__header">
        <h1>Accounts</h1>
        <Link to="/accounts/new" className="accounts-btn accounts-btn--primary">
          Create Account
        </Link>
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

      {loading && <p>Loading accounts…</p>}
      {loadError && <div className="accounts-error">{loadError}</div>}

      {!loading && !loadError && (
        <table className="accounts-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>External Key</th>
              <th>Email</th>
              <th>Currency</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr>
                <td colSpan={5} className="accounts-table__empty">
                  No accounts found.
                </td>
              </tr>
            )}
            {accounts.map((account) => (
              <tr
                key={account.accountId}
                className="accounts-table__row"
                onClick={() => navigate(`/accounts/${account.accountId}`)}
              >
                <td>{account.name || <span className="accounts-muted">—</span>}</td>
                <td>{account.externalKey}</td>
                <td>{account.email || <span className="accounts-muted">—</span>}</td>
                <td>{account.currency || <span className="accounts-muted">—</span>}</td>
                <td>{account.accountBalance ?? <span className="accounts-muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
