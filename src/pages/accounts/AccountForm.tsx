import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { createAccount, getAccountById, updateAccount } from '../../api/accounts';
import type { AccountCreateRequest, AccountUpdateRequest } from '../../api/accounts';
import './Accounts.css';

/**
 * Create/edit form for accounts.
 *
 * Field set matches the backend DTOs exactly:
 *  - AccountCreateRequest: externalKey (required) + all profile fields +
 *    parentAccountId / paymentDelegatedToParent / billingCycleDayLocal,
 *    which can only be set at creation time.
 *  - AccountUpdateRequest: the profile fields only (no externalKey, no
 *    parent/billing-cycle fields) — those are shown read-only when editing.
 */

interface FormState {
  externalKey: string;
  email: string;
  name: string;
  currency: string;
  timeZone: string;
  locale: string;
  address1: string;
  address2: string;
  companyName: string;
  city: string;
  stateOrProvince: string;
  country: string;
  postalCode: string;
  phone: string;
  notes: string;
  parentAccountId: string;
  paymentDelegatedToParent: boolean;
  billingCycleDayLocal: string;
}

const EMPTY_FORM: FormState = {
  externalKey: '',
  email: '',
  name: '',
  currency: '',
  timeZone: '',
  locale: '',
  address1: '',
  address2: '',
  companyName: '',
  city: '',
  stateOrProvince: '',
  country: '',
  postalCode: '',
  phone: '',
  notes: '',
  parentAccountId: '',
  paymentDelegatedToParent: false,
  billingCycleDayLocal: '',
};

export function AccountForm() {
  const { accountId } = useParams<{ accountId: string }>();
  const isEdit = Boolean(accountId);
  const navigate = useNavigate();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    getAccountById(accountId)
      .then((account) => {
        if (cancelled) return;
        setForm({
          externalKey: account.externalKey ?? '',
          email: account.email ?? '',
          name: account.name ?? '',
          currency: account.currency ?? '',
          timeZone: account.timeZone ?? '',
          locale: account.locale ?? '',
          address1: account.address1 ?? '',
          address2: account.address2 ?? '',
          companyName: account.companyName ?? '',
          city: account.city ?? '',
          stateOrProvince: account.stateOrProvince ?? '',
          country: account.country ?? '',
          postalCode: account.postalCode ?? '',
          phone: account.phone ?? '',
          notes: account.notes ?? '',
          parentAccountId: account.parentAccountId ?? '',
          paymentDelegatedToParent: account.paymentDelegatedToParent,
          billingCycleDayLocal:
            account.billingCycleDayLocal !== null && account.billingCycleDayLocal !== undefined
              ? String(account.billingCycleDayLocal)
              : '',
        });
      })
      .catch(() => {
        if (!cancelled) setError('Unable to load account.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit && !form.externalKey.trim()) {
      setError('External key is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && accountId) {
        const request: AccountUpdateRequest = {
          email: form.email || undefined,
          name: form.name || undefined,
          currency: form.currency || undefined,
          timeZone: form.timeZone || undefined,
          locale: form.locale || undefined,
          address1: form.address1 || undefined,
          address2: form.address2 || undefined,
          companyName: form.companyName || undefined,
          city: form.city || undefined,
          stateOrProvince: form.stateOrProvince || undefined,
          country: form.country || undefined,
          postalCode: form.postalCode || undefined,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
        };
        await updateAccount(accountId, request);
        navigate(`/accounts/${accountId}`);
      } else {
        const request: AccountCreateRequest = {
          externalKey: form.externalKey.trim(),
          email: form.email || undefined,
          name: form.name || undefined,
          currency: form.currency || undefined,
          timeZone: form.timeZone || undefined,
          locale: form.locale || undefined,
          address1: form.address1 || undefined,
          address2: form.address2 || undefined,
          companyName: form.companyName || undefined,
          city: form.city || undefined,
          stateOrProvince: form.stateOrProvince || undefined,
          country: form.country || undefined,
          postalCode: form.postalCode || undefined,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
          parentAccountId: form.parentAccountId || undefined,
          paymentDelegatedToParent: form.paymentDelegatedToParent || undefined,
          billingCycleDayLocal: form.billingCycleDayLocal ? Number(form.billingCycleDayLocal) : undefined,
        };
        const created = await createAccount(request);
        navigate(`/accounts/${created.accountId}`);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const message =
          (err.body && typeof err.body === 'object' && 'message' in err.body
            ? String((err.body as { message?: unknown }).message)
            : null) ?? `Request failed (${err.status}).`;
        setError(message);
      } else {
        setError('Unable to save account. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p>Loading account…</p>;
  }

  return (
    <div className="accounts-page">
      <h1>{isEdit ? 'Edit Account' : 'Create Account'}</h1>

      <form className="accounts-form" onSubmit={handleSubmit}>
        {error && <div className="accounts-error">{error}</div>}

        <div className="accounts-form__grid">
          <div className="accounts-field">
            <label htmlFor="externalKey">External Key {!isEdit && '*'}</label>
            <input
              id="externalKey"
              type="text"
              value={form.externalKey}
              onChange={(e) => update('externalKey', e.target.value)}
              disabled={isEdit}
              required={!isEdit}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="name">Name</label>
            <input id="name" type="text" value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>

          <div className="accounts-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>

          <div className="accounts-field">
            <label htmlFor="companyName">Company Name</label>
            <input
              id="companyName"
              type="text"
              value={form.companyName}
              onChange={(e) => update('companyName', e.target.value)}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="currency">Currency</label>
            <input
              id="currency"
              type="text"
              placeholder="USD"
              value={form.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase())}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="timeZone">Time Zone</label>
            <input
              id="timeZone"
              type="text"
              placeholder="UTC"
              value={form.timeZone}
              onChange={(e) => update('timeZone', e.target.value)}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="locale">Locale</label>
            <input
              id="locale"
              type="text"
              placeholder="en_US"
              value={form.locale}
              onChange={(e) => update('locale', e.target.value)}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>

          <div className="accounts-field">
            <label htmlFor="address1">Address 1</label>
            <input
              id="address1"
              type="text"
              value={form.address1}
              onChange={(e) => update('address1', e.target.value)}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="address2">Address 2</label>
            <input
              id="address2"
              type="text"
              value={form.address2}
              onChange={(e) => update('address2', e.target.value)}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="city">City</label>
            <input id="city" type="text" value={form.city} onChange={(e) => update('city', e.target.value)} />
          </div>

          <div className="accounts-field">
            <label htmlFor="stateOrProvince">State / Province</label>
            <input
              id="stateOrProvince"
              type="text"
              value={form.stateOrProvince}
              onChange={(e) => update('stateOrProvince', e.target.value)}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="postalCode">Postal Code</label>
            <input
              id="postalCode"
              type="text"
              value={form.postalCode}
              onChange={(e) => update('postalCode', e.target.value)}
            />
          </div>

          <div className="accounts-field">
            <label htmlFor="country">Country</label>
            <input
              id="country"
              type="text"
              value={form.country}
              onChange={(e) => update('country', e.target.value)}
            />
          </div>

          {!isEdit && (
            <>
              <div className="accounts-field">
                <label htmlFor="parentAccountId">Parent Account Id</label>
                <input
                  id="parentAccountId"
                  type="text"
                  value={form.parentAccountId}
                  onChange={(e) => update('parentAccountId', e.target.value)}
                />
              </div>

              <div className="accounts-field">
                <label htmlFor="billingCycleDayLocal">Billing Cycle Day</label>
                <input
                  id="billingCycleDayLocal"
                  type="number"
                  min={1}
                  max={31}
                  value={form.billingCycleDayLocal}
                  onChange={(e) => update('billingCycleDayLocal', e.target.value)}
                />
              </div>

              <div className="accounts-field accounts-field--checkbox">
                <label htmlFor="paymentDelegatedToParent">
                  <input
                    id="paymentDelegatedToParent"
                    type="checkbox"
                    checked={form.paymentDelegatedToParent}
                    onChange={(e) => update('paymentDelegatedToParent', e.target.checked)}
                  />
                  Payment delegated to parent
                </label>
              </div>
            </>
          )}

          <div className="accounts-field accounts-field--full">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" rows={3} value={form.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>
        </div>

        <div className="accounts-form__actions">
          <button type="submit" className="accounts-btn accounts-btn--primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Account'}
          </button>
          <button
            type="button"
            className="accounts-btn"
            onClick={() => navigate(isEdit && accountId ? `/accounts/${accountId}` : '/accounts')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
