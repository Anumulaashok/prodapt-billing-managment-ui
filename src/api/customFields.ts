/**
 * Global custom-field API calls (the cross-tenant custom field listing),
 * built on the generic apiGet primitive from `./client`. Account-scoped
 * custom field operations live in `./accounts`; this file covers the
 * tenant-wide view.
 *
 * Endpoint and DTO shape verified directly against the backend source:
 *  - org.killbill.springboot.util.customfield.web.CustomFieldController / dto.CustomFieldResponse
 */
import { apiGet } from './client';
import type { CustomFieldResponse } from './accounts';

export type { CustomFieldResponse };

export interface CustomFieldListResponse {
  customFields: CustomFieldResponse[];
  totalCount: number;
}

/** GET /1.0/kb/customFields?page=&size= — every custom field on any object in the current tenant. */
export function listGlobalCustomFields(page = 0, size = 50): Promise<CustomFieldListResponse> {
  return apiGet<CustomFieldListResponse>(`/1.0/kb/customFields?page=${page}&size=${size}`);
}
