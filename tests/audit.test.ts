import {auditEngine} from '../src/audit/auditEngine';
import {TransactionRecord} from '../src/types';

describe('Audit engine', () => {
  it('should flag suspicious transactions and produce a summary', () => {
    const transactions: TransactionRecord[] = [
      {
        id: 'tx1',
        accountId: 'GACCOUNT1',
        amount: '1300',
        assetCode: 'XLM',
        memo: 'Large transfer',
        sourceAccount: 'GACCOUNT1',
        operationType: 'payment',
        verified: true,
        rawJson: {},
      },
      {
        id: 'tx2',
        accountId: 'GACCOUNT1',
        amount: '10',
        assetCode: 'XLM',
        memo: 'Unverified',
        sourceAccount: 'GACCOUNT1',
        operationType: 'payment',
        verified: false,
        rawJson: {},
      },
    ];

    const result = auditEngine.analyze(transactions);

    expect(result.findings.length).toBeGreaterThanOrEqual(2);
    expect(result.summary).toContain('suspicious');
  });
});
