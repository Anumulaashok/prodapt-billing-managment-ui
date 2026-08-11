/**
 * Account-domain API calls, built on the generic apiGet/apiPost/apiPut/apiDelete
 * primitives from `./client`. Mirrors the Spring Boot backend's Kill
 * Bill-compatible surface under `/1.0/kb/accounts`.
 *
 * Endpoints and DTO shapes were read directly from the backend source:
 *  - org.killbill.springboot.account.web.AccountController
 *  - org.killbill.springboot.account.web.dto.{AccountResponse,AccountCreateRequest,AccountUpdateRequest}
 *  - org.killbill.springboot.account.web.AccountTimelineController / AccountTimelineResponse
 *  - org.killbill.springboot.account.email.AccountEmailController / dto
 *  - org.killbill.springboot.subscription.web.AccountBundleController / BundleResponse
 *  - org.killbill.springboot.util.tag.web.{TagController,TagDefinitionController} / dto
 *  - org.killbill.springboot.util.customfield.web.CustomFieldController / dto
 *  - org.killbill.springboot.overdue.web.OverdueController / OverdueStateView
 */
import { apiDelete, apiGet, apiPost, apiPut } from './client';

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

export interface AccountResponse {
  accountId: string;
  externalKey: string;
  email: string | null;
  name: string | null;
  currency: string | null;
  timeZone: string | null;
  locale: string | null;
  address1: string | null;
  address2: string | null;
  companyName: string | null;
  city: string | null;
  stateOrProvince: string | null;
  country: string | null;
  postalCode: string | null;
  phone: string | null;
  notes: string | null;
  parentAccountId: string | null;
  paymentDelegatedToParent: boolean;
  billingCycleDayLocal: number | null;
  createdDate: string | null;
  updatedDate: string | null;
  accountBalance: string | null;
  accountCBA: string | null;
}

export interface AccountCreateRequest {
  externalKey: string;
  email?: string;
  name?: string;
  currency?: string;
  timeZone?: string;
  locale?: string;
  address1?: string;
  address2?: string;
  companyName?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  notes?: string;
  parentAccountId?: string;
  paymentDelegatedToParent?: boolean;
  billingCycleDayLocal?: number;
}

export interface AccountUpdateRequest {
  email?: string;
  name?: string;
  currency?: string;
  timeZone?: string;
  locale?: string;
  address1?: string;
  address2?: string;
  companyName?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  notes?: string;
}

/** GET /1.0/kb/accounts — lists every account in the current tenant. */
export function listAccounts(withBalance = false): Promise<AccountResponse[]> {
  return apiGet<AccountResponse[]>(`/1.0/kb/accounts?accountWithBalance=${withBalance}`);
}

/** GET /1.0/kb/accounts?externalKey=... */
export function getAccountByExternalKey(externalKey: string, withBalance = false): Promise<AccountResponse> {
  return apiGet<AccountResponse>(
    `/1.0/kb/accounts?externalKey=${encodeURIComponent(externalKey)}&accountWithBalance=${withBalance}`,
  );
}

/** GET /1.0/kb/accounts/{accountId} */
export function getAccountById(accountId: string, withBalance = false): Promise<AccountResponse> {
  return apiGet<AccountResponse>(
    `/1.0/kb/accounts/${encodeURIComponent(accountId)}?accountWithBalance=${withBalance}`,
  );
}

/** GET /1.0/kb/accounts/{accountId}/children */
export function listChildAccounts(accountId: string): Promise<AccountResponse[]> {
  return apiGet<AccountResponse[]>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/children`);
}

/** POST /1.0/kb/accounts */
export function createAccount(request: AccountCreateRequest): Promise<AccountResponse> {
  return apiPost<AccountResponse>('/1.0/kb/accounts', request);
}

/** PUT /1.0/kb/accounts/{accountId} */
export function updateAccount(accountId: string, request: AccountUpdateRequest): Promise<AccountResponse> {
  return apiPut<AccountResponse>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}`, request);
}

/** DELETE /1.0/kb/accounts/{accountId} */
export function deleteAccount(accountId: string): Promise<void> {
  return apiDelete<void>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}`);
}

// ---------------------------------------------------------------------------
// Timeline (flattened bundles/invoices/payments/tags view)
// ---------------------------------------------------------------------------

export interface InvoiceSummaryResponse {
  invoiceId: string;
  accountId: string;
  invoiceNumber?: string | null;
  amount?: string | null;
  balance?: string | null;
  currency?: string | null;
  status?: string | null;
  targetDate?: string | null;
  invoiceDate?: string | null;
  [key: string]: unknown;
}

export interface PaymentResponse {
  paymentId: string;
  accountId: string;
  paymentNumber?: string | null;
  authAmount?: string | null;
  capturedAmount?: string | null;
  purchasedAmount?: string | null;
  refundedAmount?: string | null;
  currency?: string | null;
  status?: string | null;
  [key: string]: unknown;
}

export interface AccountTimelineResponse {
  account: AccountResponse;
  bundles: BundleResponse[];
  invoices: InvoiceSummaryResponse[];
  payments: PaymentResponse[];
  tags: TagResponse[];
}

/** GET /1.0/kb/accounts/{accountId}/timeline */
export function getAccountTimeline(accountId: string): Promise<AccountTimelineResponse> {
  return apiGet<AccountTimelineResponse>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/timeline`);
}

// ---------------------------------------------------------------------------
// Emails
// ---------------------------------------------------------------------------

export interface AccountEmailResponse {
  accountEmailId: string;
  accountId: string;
  email: string;
}

/** GET /1.0/kb/accounts/{accountId}/emails */
export function listAccountEmails(accountId: string): Promise<AccountEmailResponse[]> {
  return apiGet<AccountEmailResponse[]>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/emails`);
}

/** POST /1.0/kb/accounts/{accountId}/emails */
export function addAccountEmail(accountId: string, email: string): Promise<AccountEmailResponse> {
  return apiPost<AccountEmailResponse>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/emails`, { email });
}

/** DELETE /1.0/kb/accounts/{accountId}/emails/{accountEmailId} */
export function deleteAccountEmail(accountId: string, accountEmailId: string): Promise<void> {
  return apiDelete<void>(
    `/1.0/kb/accounts/${encodeURIComponent(accountId)}/emails/${encodeURIComponent(accountEmailId)}`,
  );
}

// ---------------------------------------------------------------------------
// Bundles (subscriptions)
// ---------------------------------------------------------------------------

export interface BundleResponse {
  bundleId: string;
  externalKey: string;
  accountId: string;
  isBlocked: boolean;
  pausedDate: string | null;
}

/** GET /1.0/kb/accounts/{accountId}/bundles */
export function listAccountBundles(accountId: string): Promise<BundleResponse[]> {
  return apiGet<BundleResponse[]>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/bundles`);
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export interface TagResponse {
  tagId: string;
  objectId: string;
  objectType: string;
  tagDefinitionId: string;
}

export interface TagDefinitionResponse {
  id: string;
  name: string;
  description: string | null;
  applicableObjectTypes: string | null;
}

/** GET /1.0/kb/accounts/{accountId}/tags */
export function listAccountTags(accountId: string): Promise<TagResponse[]> {
  return apiGet<TagResponse[]>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/tags`);
}

/** POST /1.0/kb/accounts/{accountId}/tags */
export function addAccountTag(accountId: string, tagDefinitionId: string): Promise<TagResponse> {
  return apiPost<TagResponse>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/tags`, { tagDefinitionId });
}

/** DELETE /1.0/kb/accounts/{accountId}/tags/{tagId} */
export function deleteAccountTag(accountId: string, tagId: string): Promise<void> {
  return apiDelete<void>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/tags/${encodeURIComponent(tagId)}`);
}

/** GET /1.0/kb/tagDefinitions — used to resolve tag names and to populate the "add tag" picker. */
export function listTagDefinitions(): Promise<TagDefinitionResponse[]> {
  return apiGet<TagDefinitionResponse[]>('/1.0/kb/tagDefinitions');
}

// ---------------------------------------------------------------------------
// Custom fields
// ---------------------------------------------------------------------------

export interface CustomFieldResponse {
  customFieldId: string;
  objectId: string;
  objectType: string;
  name: string;
  value: string | null;
}

/** GET /1.0/kb/accounts/{accountId}/customFields */
export function listAccountCustomFields(accountId: string): Promise<CustomFieldResponse[]> {
  return apiGet<CustomFieldResponse[]>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/customFields`);
}

/** POST /1.0/kb/accounts/{accountId}/customFields */
export function addAccountCustomField(accountId: string, name: string, value: string): Promise<CustomFieldResponse> {
  return apiPost<CustomFieldResponse>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/customFields`, {
    name,
    value,
  });
}

/** DELETE /1.0/kb/accounts/{accountId}/customFields/{customFieldId} */
export function deleteAccountCustomField(accountId: string, customFieldId: string): Promise<void> {
  return apiDelete<void>(
    `/1.0/kb/accounts/${encodeURIComponent(accountId)}/customFields/${encodeURIComponent(customFieldId)}`,
  );
}

// ---------------------------------------------------------------------------
// Overdue
// ---------------------------------------------------------------------------

export interface OverdueStateView {
  stateName: string;
  daysSinceEarliestUnpaidInvoice: number;
  blockChanges: boolean;
  disableEntitlement: boolean;
  externalMessage: string | null;
}

/** GET /1.0/kb/accounts/{accountId}/overdue */
export function getAccountOverdueState(accountId: string): Promise<OverdueStateView> {
  return apiGet<OverdueStateView>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/overdue`);
}
