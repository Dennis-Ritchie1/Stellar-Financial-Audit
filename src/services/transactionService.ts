import {Prisma} from '@prisma/client';
import {TransactionRecord} from '../types';
import {prisma} from '../config/prismaClient';
import {stellarService} from '../blockchain/stellarService';

export const fetchAndSaveTransactions = async (accountId: string) => {
  const records = await stellarService.fetchTransactions(accountId);

  const saved = await Promise.all(
    records.map(async (record) => {
      const existing = await prisma.transaction.findUnique({
        where: {stellarId: record.id},
      });

      if (existing) return existing;

      return prisma.transaction.create({
        data: {
          stellarId: record.id,
          accountId,
          amount: record.amount,
          assetCode: record.assetCode,
          memo: record.memo,
          sourceAccount: record.sourceAccount,
          operationType: record.operationType,
          verified: record.verified,
          rawJson: record.rawJson as Prisma.JsonValue,
        },
      });
    })
  );

  return saved;
};
