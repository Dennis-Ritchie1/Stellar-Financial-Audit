import {verifyTransaction} from '../src/blockchain/stellarService';

describe('Stellar verification', () => {
  it('should verify a minimal transaction record', () => {
    const record = {
      id: '12345',
      source_account: 'GABC',
      amount: '100',
      ledger: 1234,
    };

    expect(verifyTransaction(record)).toBe(true);
  });

  it('should reject an invalid transaction record', () => {
    const record = {
      id: '',
      source_account: 'GABC',
      amount: '100',
    };

    expect(verifyTransaction(record)).toBe(false);
  });
});
