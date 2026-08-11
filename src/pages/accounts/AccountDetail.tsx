import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  addAccountCustomField,
  addAccountEmail,
  addAccountTag,
  deleteAccountCustomField,
  deleteAccountEmail,
  deleteAccountTag,
  getAccountById,
  getAccountOverdueState,
  listAccountCustomFields,
  listAccountEmails,
  listAccountTags,
  listTagDefinitions,
} from '../../api/accounts';
import type {
  AccountResponse,
  AccountEmailResponse,
  CustomFieldResponse,
  OverdueStateView,
  TagResponse,
  TagDefinitionResponse,
} from '../../api/accounts';
import { BundleList } from '../subscriptions/BundleList';
import { InvoiceList } from '../invoices/InvoiceList';
import { PaymentList } from '../payments/PaymentList';
import { LockedBadge } from '../../components/Locked';
import './Accounts.css';

type TabKey = 'info' | 'bundles' | 'invoices' | 'payments' | 'tags' | 'customFields' | 'emails' | 'overdue';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Info' },
  { key: 'bundles', label: 'Bundles' },
  { key: 'invoices', label: 'Invoices' },
  { key: 'payments', label: 'Payments' },
  { key: 'tags', label: 'Tags' },
  { key: 'customFields', label: 'Custom Fields' },
  { key: 'emails', label: 'Emails' },
  { key: 'overdue', label: 'Overdue' },
];

/**
 * Account detail page — /accounts/:accountId. Tabbed view combining the
 * account's own info with the sub-resource widgets built by the
 * Subscriptions/Invoices/Payments feature areas (each self-contained,
 * taking only an accountId prop).
 */
export function AccountDetail() {
  const { accountId } = useParams<{ accountId: string }>();
  const [tab, setTab] = useState<TabKey>('info');

  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    getAccountById(accountId, true)
      .then((data) => {
        if (!cancelled) setAccount(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Unable to load account.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (!accountId) return null;

  return (
    <div className="accounts-page">
      <div className="account-detail__header">
        <div>
          <h1>{account?.name || account?.externalKey || 'Account'}</h1>
          <div className="account-detail__subtitle">{accountId}</div>
        </div>
        <Link to={`/accounts/${accountId}/edit`} className="accounts-btn">
          Edit
        </Link>
      </div>

      {loading && <p>Loading account…</p>}
      {loadError && <div className="accounts-error">{loadError}</div>}

      {!loading && !loadError && account && (
        <>
          <div className="account-detail__tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`account-detail__tab ${tab === t.key ? 'account-detail__tab--active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
            <span className="account-detail__tab account-detail__tab--locked">
              Timeline
              <LockedBadge tooltip="Combined activity timeline isn't available yet — use the Bundles/Invoices/Payments tabs." />
            </span>
          </div>

          <div className="account-detail__panel">
            {tab === 'info' && <AccountInfoPanel account={account} />}
            {tab === 'bundles' && <BundleList accountId={accountId} />}
            {tab === 'invoices' && <InvoiceList accountId={accountId} />}
            {tab === 'payments' && <PaymentList accountId={accountId} />}
            {tab === 'tags' && <AccountTagsPanel accountId={accountId} />}
            {tab === 'customFields' && <AccountCustomFieldsPanel accountId={accountId} />}
            {tab === 'emails' && <AccountEmailsPanel accountId={accountId} />}
            {tab === 'overdue' && <AccountOverduePanel accountId={accountId} />}
          </div>
        </>
      )}
    </div>
  );
}

function AccountInfoPanel({ account }: { account: AccountResponse }) {
  const fields: [string, string | null | undefined][] = [
    ['External Key', account.externalKey],
    ['Email', account.email],
    ['Currency', account.currency],
    ['Balance', account.accountBalance],
    ['CBA', account.accountCBA],
    ['Time Zone', account.timeZone],
    ['Locale', account.locale],
    ['Company', account.companyName],
    ['Phone', account.phone],
    ['Address', account.address1],
    ['City', account.city],
    ['State/Province', account.stateOrProvince],
    ['Country', account.country],
    ['Postal Code', account.postalCode],
    ['Billing Cycle Day', account.billingCycleDayLocal != null ? String(account.billingCycleDayLocal) : null],
    ['Created', account.createdDate],
    ['Updated', account.updatedDate],
  ];

  return (
    <div className="account-detail__info-grid">
      {fields.map(([label, value]) => (
        <div className="account-detail__info-item" key={label}>
          <label>{label}</label>
          <div>{value || <span className="accounts-muted">—</span>}</div>
        </div>
      ))}
    </div>
  );
}

function AccountTagsPanel({ accountId }: { accountId: string }) {
  const [tags, setTags] = useState<TagResponse[]>([]);
  const [definitions, setDefinitions] = useState<TagDefinitionResponse[]>([]);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    Promise.all([listAccountTags(accountId), listTagDefinitions()])
      .then(([t, defs]) => {
        setTags(t);
        setDefinitions(defs);
      })
      .catch(() => setError('Failed to load tags.'))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [accountId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      await addAccountTag(accountId, selected);
      setSelected('');
      reload();
    } catch {
      setError('Failed to add tag.');
    }
  }

  async function handleRemove(tagId: string) {
    try {
      await deleteAccountTag(accountId, tagId);
      reload();
    } catch {
      setError('Failed to remove tag.');
    }
  }

  const nameFor = (tagDefinitionId: string) =>
    definitions.find((d) => d.id === tagDefinitionId)?.name || tagDefinitionId;

  if (loading) return <p>Loading tags…</p>;

  return (
    <div>
      {error && <div className="accounts-error">{error}</div>}
      <ul className="account-detail__list">
        {tags.length === 0 && <li className="accounts-muted">No tags.</li>}
        {tags.map((tag) => (
          <li className="account-detail__list-item" key={tag.tagId}>
            <span>{nameFor(tag.tagDefinitionId)}</span>
            <button className="account-detail__remove-btn" onClick={() => handleRemove(tag.tagId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form className="account-detail__add-row" onSubmit={handleAdd}>
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Select a tag…</option>
          {definitions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button type="submit" className="accounts-btn" disabled={!selected}>
          Add Tag
        </button>
      </form>
    </div>
  );
}

function AccountCustomFieldsPanel({ accountId }: { accountId: string }) {
  const [fields, setFields] = useState<CustomFieldResponse[]>([]);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    listAccountCustomFields(accountId)
      .then(setFields)
      .catch(() => setError('Failed to load custom fields.'))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [accountId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await addAccountCustomField(accountId, name.trim(), value.trim());
      setName('');
      setValue('');
      reload();
    } catch {
      setError('Failed to add custom field.');
    }
  }

  async function handleRemove(customFieldId: string) {
    try {
      await deleteAccountCustomField(accountId, customFieldId);
      reload();
    } catch {
      setError('Failed to remove custom field.');
    }
  }

  if (loading) return <p>Loading custom fields…</p>;

  return (
    <div>
      {error && <div className="accounts-error">{error}</div>}
      <ul className="account-detail__list">
        {fields.length === 0 && <li className="accounts-muted">No custom fields.</li>}
        {fields.map((f) => (
          <li className="account-detail__list-item" key={f.customFieldId}>
            <span>
              <strong>{f.name}</strong> = {f.value}
            </span>
            <button className="account-detail__remove-btn" onClick={() => handleRemove(f.customFieldId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form className="account-detail__add-row" onSubmit={handleAdd}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <input placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
        <button type="submit" className="accounts-btn" disabled={!name.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}

function AccountEmailsPanel({ accountId }: { accountId: string }) {
  const [emails, setEmails] = useState<AccountEmailResponse[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  function reload() {
    setLoading(true);
    listAccountEmails(accountId)
      .then(setEmails)
      .catch(() => setError('Failed to load emails.'))
      .finally(() => setLoading(false));
  }

  useEffect(reload, [accountId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      await addAccountEmail(accountId, email.trim());
      setEmail('');
      reload();
    } catch {
      setError('Failed to add email.');
    }
  }

  async function handleRemove(accountEmailId: string) {
    try {
      await deleteAccountEmail(accountId, accountEmailId);
      reload();
    } catch {
      setError('Failed to remove email.');
    }
  }

  if (loading) return <p>Loading emails…</p>;

  return (
    <div>
      {error && <div className="accounts-error">{error}</div>}
      <ul className="account-detail__list">
        {emails.length === 0 && <li className="accounts-muted">No notification emails.</li>}
        {emails.map((e) => (
          <li className="account-detail__list-item" key={e.accountEmailId}>
            <span>{e.email}</span>
            <button className="account-detail__remove-btn" onClick={() => handleRemove(e.accountEmailId)}>
              Remove
            </button>
          </li>
        ))}
      </ul>
      <form className="account-detail__add-row" onSubmit={handleAdd}>
        <input placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="accounts-btn" disabled={!email.trim()}>
          Add
        </button>
      </form>
    </div>
  );
}

function AccountOverduePanel({ accountId }: { accountId: string }) {
  const [state, setState] = useState<OverdueStateView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getAccountOverdueState(accountId)
      .then((data) => {
        if (!cancelled) setState(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setState(null);
        } else {
          setError('Failed to load overdue state.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accountId]);

  if (loading) return <p>Loading overdue state…</p>;
  if (error) return <div className="accounts-error">{error}</div>;
  if (!state) return <p className="accounts-muted">This account is not in an overdue state.</p>;

  return (
    <div className="account-detail__info-grid">
      <div className="account-detail__info-item">
        <label>State</label>
        <div>{state.stateName}</div>
      </div>
      <div className="account-detail__info-item">
        <label>Days Since Earliest Unpaid Invoice</label>
        <div>{state.daysSinceEarliestUnpaidInvoice}</div>
      </div>
      <div className="account-detail__info-item">
        <label>Blocks Changes</label>
        <div>{state.blockChanges ? 'Yes' : 'No'}</div>
      </div>
      <div className="account-detail__info-item">
        <label>Disables Entitlement</label>
        <div>{state.disableEntitlement ? 'Yes' : 'No'}</div>
      </div>
      <div className="account-detail__info-item">
        <label>Message</label>
        <div>{state.externalMessage || <span className="accounts-muted">—</span>}</div>
      </div>
    </div>
  );
}
