/**
 * Generic authenticated HTTP client for the Prodapt backend (Spring Boot,
 * Kill Bill-compatible API surface).
 *
 * This module intentionally knows nothing about specific business endpoints
 * (accounts, invoices, payments, etc). It only provides the low-level
 * authenticated request primitives — apiGet / apiPost / apiPut / apiDelete —
 * that page-level code should build on.
 *
 * WHERE TO ADD ENDPOINT-SPECIFIC CALLS:
 * Do NOT add business endpoints here. Instead create a file per domain,
 * e.g. `src/api/accounts.ts`, `src/api/invoices.ts`, and have those files
 * call apiGet/apiPost/apiPut/apiDelete from this module. Keep this file
 * generic.
 */

const DEFAULT_BASE_URL = 'http://127.0.0.1:7070';

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE_URL;

export const AUTH_TOKEN_STORAGE_KEY = 'prodapt_auth_token';
export const CURRENT_TENANT_STORAGE_KEY = 'prodapt_current_tenant';

export interface StoredTenant {
  name: string;
  apiKey: string;
  apiSecret: string;
}

/** Reads the persisted auth token directly from localStorage. */
function readAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

/** Reads the persisted current tenant directly from localStorage. */
function readCurrentTenant(): StoredTenant | null {
  try {
    const raw = localStorage.getItem(CURRENT_TENANT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTenant;
  } catch {
    return null;
  }
}

/** Clears persisted auth state (used on 401 responses). */
function clearAuthState(): void {
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Core authenticated request primitive. Attaches auth/tenant headers,
 * handles JSON encoding/decoding, and redirects to /login on 401.
 */
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options;

  const finalHeaders: Record<string, string> = { ...headers };

  const token = readAuthToken();
  if (token) {
    finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  const tenant = readCurrentTenant();
  if (tenant) {
    finalHeaders['X-Killbill-ApiKey'] = tenant.apiKey;
    finalHeaders['X-Killbill-ApiSecret'] = tenant.apiSecret;
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    body: requestBody,
  });

  if (response.status === 401) {
    clearAuthState();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = undefined;
    }
    throw new ApiError(response.status, `Request failed: ${response.status}`, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return undefined as T;
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'GET' });
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: 'PUT', body });
}

export function apiDelete<T>(path: string): Promise<T> {
  return request<T>(path, { method: 'DELETE' });
}
