/**
 * @fileoverview Type definitions for audit logging functionality
 */

/**
 * Represents a single audit log entry
 */
export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedBy: string;
  performedAt: Date;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'error';
}

/**
 * Filters for querying audit logs
 */
export interface AuditLogFilters {
  entityType?: string;
  action?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  search?: string;
}

/**
 * Pagination parameters for audit logs
 */
export interface AuditLogPagination {
  page: number;
  rowsPerPage: number;
}

/**
 * Statistics about audit logs
 */
export interface AuditStatistics {
  actionByTypes: Record<string, number>;
  entityTypeDistributions: Record<string, number>;
 
}
