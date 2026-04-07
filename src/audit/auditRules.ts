export interface AuditFinding {
  rule: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export const auditRules = {
  largePayment: (amount: number, threshold = 1000): AuditFinding | null => {
    return amount >= threshold
      ? {rule: 'largePayment', description: `Transaction amount ${amount} exceeds threshold ${threshold}`, severity: 'medium'}
      : null;
  },
  unverifiedTransaction: (verified: boolean): AuditFinding | null => {
    return !verified
      ? {rule: 'unverifiedTransaction', description: 'Transaction verification failed or incomplete', severity: 'high'}
      : null;
  },
  sourceMismatch: (source: string, account: string): AuditFinding | null => {
    return source !== account
      ? {rule: 'sourceMismatch', description: 'Transaction originated from unexpected source account', severity: 'low'}
      : null;
  },
};
