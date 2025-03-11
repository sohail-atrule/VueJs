import { inject } from 'vue';
// import type { AuditInterceptor } from '@/interceptors/audit.interceptor';


export function useAudit() {
  const audit = inject('audit');

  if (!audit) {
    throw new Error('Audit interceptor not provided');
  }

  return audit;
}
