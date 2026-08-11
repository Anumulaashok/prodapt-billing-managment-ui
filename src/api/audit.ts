/**
 * Audit log API calls, built on the generic apiGet primitive from
 * `./client`. The backend only exposes audit logs scoped to an account —
 * there is no cross-account/global audit endpoint.
 *
 * Endpoint and DTO shape verified directly against the backend source:
 *  - org.killbill.springboot.util.audit.web.AuditLogController / dto.AuditLogResponse
 */
import { apiGet } from './client';

export interface AuditLogResponse {
  auditLogId: string;
  tableName: string;
  targetRecordId: string;
  changeType: string;
  reasonCode: string | null;
  comments: string | null;
  userToken: string | null;
  createdBy: string | null;
  createdDate: string | null;
}

export interface AuditLogListResponse {
  auditLogs: AuditLogResponse[];
  totalCount: number;
}

/** GET /1.0/kb/accounts/{accountId}/auditLogs */
export function listAccountAuditLogs(accountId: string): Promise<AuditLogListResponse> {
  return apiGet<AuditLogListResponse>(`/1.0/kb/accounts/${encodeURIComponent(accountId)}/auditLogs`);
}
