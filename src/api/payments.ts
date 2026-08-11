/**
 * Payment domain API calls: payments, payment methods, refunds/chargebacks.
 *
 * Endpoints verified against the backend source (killbill springboot):
 *   - org.killbill.springboot.payment.web.PaymentController
 *   - org.killbill.springboot.payment.web.AccountPaymentController
 *   - org.killbill.springboot.payment.web.PaymentMethodController
 *   - org.killbill.springboot.account.web.AccountTimelineController
 *
 * All paths are under /1.0/kb/... per the backend's Kill Bill-compatible surface.
 */

import { apiDelete, apiGet, apiPost, apiPut } from './client';

// ---------------------------------------------------------------------------
// Response / request shapes (mirroring the backend Java records exactly)
// ---------------------------------------------------------------------------

/** Mirrors PaymentTransactionResponse. */
export interface PaymentTransaction {
  transactionId: string;
  transactionType: string; // e.g. PURCHASE, REFUND, CHARGEBACK (TransactionType enum name)
  status: string; // TransactionStatus enum name, e.g. SUCCESS, FAILED, PENDING
  amount: number | null;
  currency: string | null;
  effectiveDate: string | null; // Instant, ISO string
  gatewayErrorCode: string | null;
  gatewayErrorMessage: string | null;
}

/** Mirrors PaymentResponse. */
export interface Payment {
  paymentId: string;
  accountId: string;
  paymentMethodId: string;
  stateName: string;
  transactions: PaymentTransaction[];
}

/** Mirrors PaymentMethodResponse. */
export interface PaymentMethod {
  paymentMethodId: string;
  accountId: string;
  pluginName: string;
  externalKey: string | null;
}

/** Mirrors PaymentMethodRequest — payload for creating a payment method. */
export interface CreatePaymentMethodRequest {
  pluginName: string;
  externalKey?: string;
}

/** Mirrors PurchasePaymentRequest — payload for making a payment against an account. */
export interface PurchasePaymentRequest {
  paymentMethodId: string;
  amount: number;
  currency: string;
  paymentExternalKey?: string;
}

/** Mirrors RefundRequest — amount is optional; omit/undefined means "refund/chargeback in full". */
export interface RefundRequest {
  amount?: number;
}

/** Mirrors AccountTimelineResponse, trimmed to the fields this module cares about. */
export interface AccountTimelinePayments {
  payments: Payment[];
}

// ---------------------------------------------------------------------------
// Payments
// ---------------------------------------------------------------------------

/** GET /1.0/kb/payments/{paymentId} */
export function getPayment(paymentId: string): Promise<Payment> {
  return apiGet<Payment>(`/1.0/kb/payments/${encodeURIComponent(paymentId)}`);
}

/**
 * Lists payments for an account.
 *
 * There is no dedicated `GET /accounts/{accountId}/payments` endpoint on the backend today
 * (AccountPaymentController only exposes POST for purchase/pay-invoice). The account's payments
 * are exposed via the timeline endpoint instead, same as KAUI's account detail page does.
 * GET /1.0/kb/accounts/{accountId}/timeline
 */
export async function listPaymentsForAccount(accountId: string): Promise<Payment[]> {
  const timeline = await apiGet<AccountTimelinePayments>(
    `/1.0/kb/accounts/${encodeURIComponent(accountId)}/timeline`,
  );
  return timeline.payments;
}

/** POST /1.0/kb/accounts/{accountId}/payments */
export function purchasePayment(
  accountId: string,
  request: PurchasePaymentRequest,
): Promise<Payment> {
  return apiPost<Payment>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/payments`, request);
}

/** POST /1.0/kb/accounts/{accountId}/invoices/{invoiceId}/payments (no body) */
export function payInvoice(accountId: string, invoiceId: string): Promise<Payment> {
  return apiPost<Payment>(
    `/1.0/kb/accounts/${encodeURIComponent(accountId)}/invoices/${encodeURIComponent(invoiceId)}/payments`,
  );
}

/** POST /1.0/kb/payments/{paymentId}/refunds */
export function refundPayment(paymentId: string, amount?: number): Promise<Payment> {
  const request: RefundRequest = { amount };
  return apiPost<Payment>(`/1.0/kb/payments/${encodeURIComponent(paymentId)}/refunds`, request);
}

/** POST /1.0/kb/payments/{paymentId}/chargebacks */
export function chargebackPayment(paymentId: string, amount?: number): Promise<Payment> {
  const request: RefundRequest = { amount };
  return apiPost<Payment>(
    `/1.0/kb/payments/${encodeURIComponent(paymentId)}/chargebacks`,
    request,
  );
}

// ---------------------------------------------------------------------------
// Payment methods
// ---------------------------------------------------------------------------

/** GET /1.0/kb/paymentMethods/plugins — registered plugin names, for the "add payment method" dropdown. */
export function listPaymentPlugins(): Promise<string[]> {
  return apiGet<string[]>('/1.0/kb/paymentMethods/plugins');
}

/** GET /1.0/kb/accounts/{accountId}/paymentMethods */
export function listPaymentMethods(accountId: string): Promise<PaymentMethod[]> {
  return apiGet<PaymentMethod[]>(
    `/1.0/kb/accounts/${encodeURIComponent(accountId)}/paymentMethods`,
  );
}

/** POST /1.0/kb/accounts/{accountId}/paymentMethods */
export function createPaymentMethod(
  accountId: string,
  request: CreatePaymentMethodRequest,
): Promise<PaymentMethod> {
  return apiPost<PaymentMethod>(
    `/1.0/kb/accounts/${encodeURIComponent(accountId)}/paymentMethods`,
    request,
  );
}

/** GET /1.0/kb/paymentMethods/{paymentMethodId} */
export function getPaymentMethod(paymentMethodId: string): Promise<PaymentMethod> {
  return apiGet<PaymentMethod>(`/1.0/kb/paymentMethods/${encodeURIComponent(paymentMethodId)}`);
}

/** DELETE /1.0/kb/paymentMethods/{paymentMethodId} */
export function deletePaymentMethod(paymentMethodId: string): Promise<void> {
  return apiDelete<void>(`/1.0/kb/paymentMethods/${encodeURIComponent(paymentMethodId)}`);
}

/** PUT /1.0/kb/paymentMethods/{paymentMethodId}/setDefault */
export function setDefaultPaymentMethod(
  paymentMethodId: string,
  accountId: string,
): Promise<void> {
  return apiPut<void>(`/1.0/kb/paymentMethods/${encodeURIComponent(paymentMethodId)}/setDefault`, {
    accountId,
  });
}
