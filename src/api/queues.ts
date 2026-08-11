/**
 * Notification queue API calls, built on the generic apiGet primitive from
 * `./client`. Read-only operational view of the backend's persisted
 * notification/bus queue entries.
 *
 * Endpoint and DTO shape verified directly against the backend source:
 *  - org.killbill.springboot.util.queue.web.QueueController / dto.QueueEntryResponse
 */
import { apiGet } from './client';

export interface QueueEntryResponse {
  recordId: number;
  className: string;
  eventJson: string;
  userToken: string | null;
  createdDate: string | null;
  creatingOwner: string | null;
  processingState: string | null;
  errorCount: number;
  accountRecordId: number | null;
}

export interface QueueListResponse {
  queues: QueueEntryResponse[];
  totalCount: number;
}

/** GET /1.0/kb/queues?page=&size= */
export function listQueues(page = 0, size = 50): Promise<QueueListResponse> {
  return apiGet<QueueListResponse>(`/1.0/kb/queues?page=${page}&size=${size}`);
}
