import {TransactionRecord} from '../types';
import {auditRules, AuditFinding} from './auditRules';

export const auditEngine = {
  analyze: (transactions: TransactionRecord[]): {summary: string; findings: AuditFinding[]} => {
    const findings: AuditFinding[] = [];

    transactions.forEach((tx) => {
      const amount = Number(tx.amount);
      const largePayment = auditRules.largePayment(amount);
      const unverified = auditRules.unverifiedTransaction(tx.verified);
      const sourceMismatch = auditRules.sourceMismatch(tx.sourceAccount, tx.accountId ?? '');

      [largePayment, unverified, sourceMismatch].forEach((finding) => {
        if (finding) findings.push(finding as AuditFinding);
      });
    });

    const summary = findings.length > 0
      ? `${findings.length} suspicious item(s) found`
      : 'No suspicious activity detected';

    return {summary, findings};
  },
};
