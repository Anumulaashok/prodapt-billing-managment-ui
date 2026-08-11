/**
 * Global tag-domain API calls (tag definitions + the cross-tenant tag
 * listing), built on the generic apiGet/apiPost/apiDelete primitives from
 * `./client`. Account-scoped tag operations (list/add/remove tags on a
 * single account) live in `./accounts` alongside the account APIs; this
 * file covers the tenant-wide views.
 *
 * Endpoints and DTO shapes verified directly against the backend source:
 *  - org.killbill.springboot.util.tag.web.TagDefinitionController / dto.TagDefinitionResponse
 *  - org.killbill.springboot.util.tag.web.TagController / dto.TagResponse
 */
import { apiDelete, apiGet, apiPost } from './client';
import type { TagDefinitionResponse, TagResponse } from './accounts';

export type { TagDefinitionResponse, TagResponse };

export interface TagDefinitionCreateRequest {
  name: string;
  description: string;
  /** A single object type, e.g. "ACCOUNT", "INVOICE", "BUNDLE", "PAYMENT" (not an array). */
  applicableObjectTypes: string;
}

/** POST /1.0/kb/tagDefinitions */
export function createTagDefinition(request: TagDefinitionCreateRequest): Promise<TagDefinitionResponse> {
  return apiPost<TagDefinitionResponse>('/1.0/kb/tagDefinitions', request);
}

/** GET /1.0/kb/tagDefinitions/{tagDefinitionId} */
export function getTagDefinition(tagDefinitionId: string): Promise<TagDefinitionResponse> {
  return apiGet<TagDefinitionResponse>(`/1.0/kb/tagDefinitions/${encodeURIComponent(tagDefinitionId)}`);
}

/** GET /1.0/kb/tagDefinitions — every tag definition in the current tenant. */
export function listAllTagDefinitions(): Promise<TagDefinitionResponse[]> {
  return apiGet<TagDefinitionResponse[]>('/1.0/kb/tagDefinitions');
}

/** DELETE /1.0/kb/tagDefinitions/{tagDefinitionId} */
export function deleteTagDefinition(tagDefinitionId: string): Promise<void> {
  return apiDelete<void>(`/1.0/kb/tagDefinitions/${encodeURIComponent(tagDefinitionId)}`);
}

export interface TagListResponse {
  tags: TagResponse[];
  totalCount: number;
}

/** GET /1.0/kb/tags?page=&size= — every tag applied to any object in the current tenant. */
export function listGlobalTags(page = 0, size = 50): Promise<TagListResponse> {
  return apiGet<TagListResponse>(`/1.0/kb/tags?page=${page}&size=${size}`);
}
