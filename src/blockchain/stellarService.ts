import {TransactionRecord} from '../types';
import {stellarServer} from './stellarClient';

const mapTransaction = (record: any): TransactionRecord => {
  return {
    id: record.id,
    accountId: record.account_id || record.account || undefined,
    amount: record.amount,
    assetCode: record.asset_code ?? 'XLM',
    memo: record.memo,
    sourceAccount: record.source_account,
    operationType: record.operation_type,
    verified: verifyTransaction(record),
    rawJson: record,
  };
};

export const stellarService = {
  fetchTransactions: async (accountId: string): Promise<TransactionRecord[]> => {
    const response = await stellarServer.transactions()
      .forAccount(accountId)
      .order('desc')
      .limit(25)
      .call();

    return response.records.map(mapTransaction);
  },
};

export const verifyTransaction = (record: any): boolean => {
  const hasValidId = typeof record.id === 'string' && record.id.length > 0;
  const hasSource = typeof record.source_account === 'string';
  const hasAmount = typeof record.amount === 'string';
  const hasLedger = typeof record.ledger === 'number';
  return hasValidId && hasSource && hasAmount && hasLedger;
};
