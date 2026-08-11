/**
 * Admin-domain API calls: RBAC users/roles/permissions and tenant
 * management. Built on the generic apiGet/apiPost/apiPut/apiDelete
 * primitives from `./client`.
 *
 * Endpoints verified directly against the backend source:
 *  - org.killbill.springboot.security.web.SecurityController
 *  - org.killbill.springboot.tenant.web.TenantController
 */
import { apiDelete, apiGet, apiPost, apiPut } from './client';

// ---- Users (SecurityController) ---------------------------------------------------

export interface UserResponse {
  username: string;
  isActive: boolean;
  roles: string[];
}

/** GET /1.0/kb/security/users */
export function listUsers(): Promise<UserResponse[]> {
  return apiGet<UserResponse[]>('/1.0/kb/security/users');
}

/** POST /1.0/kb/security/users */
export function createUser(username: string, password: string, roles: string[]): Promise<UserResponse> {
  return apiPost<UserResponse>('/1.0/kb/security/users', { username, password, roles });
}

/** PUT /1.0/kb/security/users/{username}/password */
export function changeUserPassword(username: string, newPassword: string): Promise<void> {
  return apiPut<void>(`/1.0/kb/security/users/${encodeURIComponent(username)}/password`, { newPassword });
}

/** PUT /1.0/kb/security/users/{username}/roles */
export function assignUserRoles(username: string, roles: string[]): Promise<void> {
  return apiPut<void>(`/1.0/kb/security/users/${encodeURIComponent(username)}/roles`, { roles });
}

/** DELETE /1.0/kb/security/users/{username} (soft-disable) */
export function disableUser(username: string): Promise<void> {
  return apiDelete<void>(`/1.0/kb/security/users/${encodeURIComponent(username)}`);
}

/** GET /1.0/kb/security/users/{username}/tenants — root-visible, any authenticated caller can read */
export function getUserTenants(username: string): Promise<TenantResponse[]> {
  return apiGet<TenantResponse[]>(`/1.0/kb/security/users/${encodeURIComponent(username)}/tenants`);
}

/** PUT /1.0/kb/security/users/{username}/tenants — root-only (403 for anyone else) */
export function assignUserTenants(username: string, tenantIds: string[]): Promise<void> {
  return apiPut<void>(`/1.0/kb/security/users/${encodeURIComponent(username)}/tenants`, { tenantIds });
}

// ---- Roles (SecurityController) ---------------------------------------------------

export interface RoleResponse {
  role: string;
  permissions: string[];
}

/** GET /1.0/kb/security/roles — every role defined in this tenant, for populating role pickers. */
export function listRoles(): Promise<RoleResponse[]> {
  return apiGet<RoleResponse[]>('/1.0/kb/security/roles');
}

/** GET /1.0/kb/security/roles/{role} */
export function getRole(role: string): Promise<RoleResponse> {
  return apiGet<RoleResponse>(`/1.0/kb/security/roles/${encodeURIComponent(role)}`);
}

/** POST /1.0/kb/security/roles (create or update) */
export function createOrUpdateRole(role: string, permissions: string[]): Promise<RoleResponse> {
  return apiPost<RoleResponse>('/1.0/kb/security/roles', { role, permissions });
}

/** GET /1.0/kb/security/permissions — the full list of valid permission strings for the caller */
export function getMyPermissions(): Promise<string[]> {
  return apiGet<string[]>('/1.0/kb/security/permissions');
}

// ---- Tenants (TenantController) ----------------------------------------------------

export interface TenantResponse {
  tenantId: string;
  externalKey: string | null;
  apiKey: string;
  apiSecret: string | null; // only ever populated on the create response
}

export interface TenantListResponse {
  tenants: TenantResponse[];
  totalCount: number;
}

/** GET /1.0/kb/tenants?page=&size= — admin listing (not the single-apiKey lookup) */
export function listTenants(page = 0, size = 50): Promise<TenantListResponse> {
  return apiGet<TenantListResponse>(`/1.0/kb/tenants?page=${page}&size=${size}`);
}

/** POST /1.0/kb/tenants */
export function createTenant(externalKey?: string): Promise<TenantResponse> {
  return apiPost<TenantResponse>('/1.0/kb/tenants', externalKey ? { externalKey } : {});
}
