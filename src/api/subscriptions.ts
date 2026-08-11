/**
 * Subscription / bundle / catalog API calls for the Subscriptions feature area.
 *
 * Backed by (paths verified against the actual @RequestMapping annotations in the
 * killbill-springboot backend):
 *   - SubscriptionController   -> /1.0/kb/subscriptions
 *   - BundleController         -> /1.0/kb/bundles                (bundle as first-class resource)
 *   - AccountBundleController  -> /1.0/kb/accounts/{accountId}/bundles
 *   - CatalogController        -> /1.0/kb/catalog
 *   - UsageController          -> /1.0/kb/subscriptions/{subscriptionId}/usage
 *
 * NOTE: there is no backend endpoint that lists the subscription(s) belonging to a
 * given bundleId (AccountBundleController/BundleController only expose bundle-level
 * fields; SubscriptionController only supports get-by-subscriptionId). Bundle -> its
 * subscriptions is therefore not fetchable in general; see BundleDetail.tsx for how
 * this gap is handled in the UI.
 */
import { apiDelete, apiGet, apiPost, apiPut } from './client';

// ---- Subscriptions (SubscriptionController) --------------------------------------

export type SubscriptionState = 'ACTIVE' | 'CANCELLED';
export type PhaseType = 'TRIAL' | 'DISCOUNT' | 'FIXEDTERM' | 'EVERGREEN';

// Mirrors org.killbill.springboot.subscription.web.SubscriptionResponse
export interface SubscriptionResponse {
  subscriptionId: string;
  bundleId: string;
  bundleExternalKey: string;
  state: SubscriptionState;
  planName: string;
  phaseType: PhaseType | null;
  startDate: string; // ISO instant
}

// Mirrors org.killbill.springboot.subscription.web.SubscriptionCreateRequest
export interface SubscriptionCreateRequest {
  accountId: string;
  bundleExternalKey?: string;
  planName: string;
}

// Mirrors org.killbill.springboot.subscription.web.SubscriptionChangeRequest
export interface SubscriptionChangeRequest {
  planName: string;
}

/** POST /1.0/kb/subscriptions */
export function createSubscription(request: SubscriptionCreateRequest): Promise<SubscriptionResponse> {
  return apiPost<SubscriptionResponse>('/1.0/kb/subscriptions', request);
}

/** GET /1.0/kb/subscriptions/{subscriptionId} */
export function getSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
  return apiGet<SubscriptionResponse>(`/1.0/kb/subscriptions/${subscriptionId}`);
}

/** PUT /1.0/kb/subscriptions/{subscriptionId} (change plan) */
export function changeSubscriptionPlan(
  subscriptionId: string,
  request: SubscriptionChangeRequest,
): Promise<SubscriptionResponse> {
  return apiPut<SubscriptionResponse>(`/1.0/kb/subscriptions/${subscriptionId}`, request);
}

/** DELETE /1.0/kb/subscriptions/{subscriptionId} (cancel) */
export function cancelSubscription(subscriptionId: string): Promise<SubscriptionResponse> {
  return apiDelete<SubscriptionResponse>(`/1.0/kb/subscriptions/${subscriptionId}`);
}

// ---- Bundles (BundleController + AccountBundleController) ------------------------

// Mirrors org.killbill.springboot.subscription.web.BundleResponse
export interface BundleResponse {
  bundleId: string;
  externalKey: string;
  accountId: string;
  isBlocked: boolean;
  pausedDate: string | null;
}

/** GET /1.0/kb/accounts/{accountId}/bundles */
export function listBundlesForAccount(accountId: string): Promise<BundleResponse[]> {
  return apiGet<BundleResponse[]>(`/1.0/kb/accounts/${accountId}/bundles`);
}

/** GET /1.0/kb/bundles/{bundleId} */
export function getBundle(bundleId: string): Promise<BundleResponse> {
  return apiGet<BundleResponse>(`/1.0/kb/bundles/${bundleId}`);
}

/** PUT /1.0/kb/bundles/{bundleId}/pause */
export function pauseBundle(bundleId: string): Promise<BundleResponse> {
  return apiPut<BundleResponse>(`/1.0/kb/bundles/${bundleId}/pause`);
}

/** PUT /1.0/kb/bundles/{bundleId}/resume */
export function resumeBundle(bundleId: string): Promise<BundleResponse> {
  return apiPut<BundleResponse>(`/1.0/kb/bundles/${bundleId}/resume`);
}

// ---- Catalog (CatalogController) — used to populate the plan dropdown ------------

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'CHF' | 'NZD';
export type BillingPeriod =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'BIENNIAL'
  | 'NO_BILLING_PERIOD';
export type ProductCategory = 'BASE' | 'ADD_ON' | 'STANDALONE';

// Mirrors org.killbill.springboot.catalog.domain.PlanPhase
export interface PlanPhase {
  type: PhaseType;
  durationUnit: 'DAYS' | 'WEEKS' | 'MONTHS' | 'YEARS' | 'UNLIMITED' | null;
  durationNumber: number | null;
  billingPeriod: BillingPeriod;
  fixedPriceZero: boolean;
  prices: Partial<Record<Currency, number>> | null;
}

// Mirrors org.killbill.springboot.catalog.domain.Plan
export interface Plan {
  name: string;
  product: string;
  phases: PlanPhase[];
}

// Mirrors org.killbill.springboot.catalog.domain.Product
export interface Product {
  name: string;
  category: ProductCategory;
  available: string[];
}

/** GET /1.0/kb/catalog/plans */
export function getPlans(): Promise<Plan[]> {
  return apiGet<Plan[]>('/1.0/kb/catalog/plans');
}

/** GET /1.0/kb/catalog/products */
export function getProducts(): Promise<Product[]> {
  return apiGet<Product[]>('/1.0/kb/catalog/products');
}

/** GET /1.0/kb/catalog/plans/{planName} */
export function getPlan(planName: string): Promise<Plan> {
  return apiGet<Plan>(`/1.0/kb/catalog/plans/${encodeURIComponent(planName)}`);
}

// ---- Usage (UsageController) ------------------------------------------------------

// Mirrors org.killbill.springboot.usage.web.RecordUsageRequest
export interface RecordUsageRequest {
  unitType: string;
  amount: number;
  recordDate?: string; // ISO instant, defaults to now on the backend
  trackingId?: string;
}

// Mirrors org.killbill.springboot.usage.web.UsageRecordResponse
export interface UsageRecordResponse {
  usageRecordId: string;
  subscriptionId: string;
  unitType: string;
  recordDate: string;
  amount: number;
  trackingId: string | null;
}

/** POST /1.0/kb/subscriptions/{subscriptionId}/usage */
export function recordUsage(subscriptionId: string, request: RecordUsageRequest): Promise<UsageRecordResponse> {
  return apiPost<UsageRecordResponse>(`/1.0/kb/subscriptions/${subscriptionId}/usage`, request);
}
