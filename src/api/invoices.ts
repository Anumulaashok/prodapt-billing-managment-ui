/**
 * Invoice domain API calls, built on the generic apiGet/apiPost/apiPut
 * primitives from `./client`. Paths and field names are sourced directly
 * from the backend controllers/DTOs:
 *   - InvoiceController            (/1.0/kb/invoices/...)
 *   - AccountInvoiceController     (/1.0/kb/accounts/{accountId}/invoices)
 *
 * Note: there is no global "list all invoices" endpoint scoped for normal
 * browsing — InvoiceController#listPaginated (/1.0/kb/invoices/pagination)
 * is a tenant-wide pagination endpoint, not account-scoped, and is not used
 * here. Invoice listing is only available per-account via
 * AccountInvoiceController#list.
 */
import { apiGet, apiPost, apiPut } from './client';

/** Mirrors InvoiceItemResponse (InvoiceController.java). */
export interface InvoiceItem {
  invoiceItemId: string;
  type: string;
  subscriptionId: string | null;
  planName: string | null;
  phaseType: string | null;
  startDate: string | null;
  endDate: string | null;
  amount: string;
  currency: string;
  description: string | null;
  linkedItemId: string | null;
}

/** Mirrors InvoiceResponse (InvoiceController.java). Full invoice detail. */
export interface InvoiceDetail {
  invoiceId: string;
  accountId: string;
  invoiceDate: string;
  targetDate: string;
  currency: string;
  status: string;
  amount: string;
  items: InvoiceItem[];
}

/**
 * Mirrors InvoiceSummaryResponse (InvoiceController.java / used by
 * AccountInvoiceController#list). Note: the backend does NOT expose an
 * amount or balance field on the summary shape — only date/currency/status.
 * Per-invoice balance also isn't tracked anywhere in the backend (only an
 * account-level aggregate balance exists, via AccountBalanceService), so
 * there's no endpoint to source a balance column from at all.
 */
export interface InvoiceSummary {
  invoiceId: string;
  invoiceDate: string;
  targetDate: string;
  currency: string;
  status: string;
}

/** Mirrors InvoiceItemAdjustmentRequest (InvoiceController.java). */
export interface InvoiceItemAdjustmentRequest {
  amount: string;
  description?: string;
}

/** Mirrors ExternalChargeRequest (InvoiceController.java). */
export interface ExternalChargeRequest {
  amount: string;
  description?: string;
}

/** GET /1.0/kb/invoices/{invoiceId} */
export function getInvoice(invoiceId: string): Promise<InvoiceDetail> {
  return apiGet<InvoiceDetail>(`/1.0/kb/invoices/${encodeURIComponent(invoiceId)}`);
}

/** GET /1.0/kb/accounts/{accountId}/invoices */
export function listAccountInvoices(accountId: string): Promise<InvoiceSummary[]> {
  return apiGet<InvoiceSummary[]>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/invoices`);
}

/**
 * POST /1.0/kb/accounts/{accountId}/invoices?targetDate=...
 * Manually triggers invoice generation for whatever's due as of targetDate
 * (there's no background job driving this automatically yet). Returns the
 * generated invoice, or null if there was nothing to invoice (backend
 * responds 204 No Content in that case).
 */
export function triggerInvoice(accountId: string, targetDate?: string): Promise<InvoiceDetail | null> {
  const query = targetDate ? `?targetDate=${encodeURIComponent(targetDate)}` : '';
  return apiPost<InvoiceDetail | null>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/invoices${query}`);
}

/** PUT /1.0/kb/invoices/{invoiceId}/items/{itemId} */
export function adjustInvoiceItem(
  invoiceId: string,
  itemId: string,
  request: InvoiceItemAdjustmentRequest,
): Promise<InvoiceItem> {
  return apiPut<InvoiceItem>(
    `/1.0/kb/invoices/${encodeURIComponent(invoiceId)}/items/${encodeURIComponent(itemId)}`,
    request,
  );
}

/** POST /1.0/kb/invoices/{invoiceId}/charges */
export function addExternalCharge(invoiceId: string, request: ExternalChargeRequest): Promise<InvoiceItem> {
  return apiPost<InvoiceItem>(`/1.0/kb/invoices/${encodeURIComponent(invoiceId)}/charges`, request);
}
