import {Worker} from 'bullmq';
import {Prisma} from '@prisma/client';
import {prisma} from '../config/prismaClient';
import {auditEngine} from '../audit/auditEngine';
import {stellarService} from '../blockchain/stellarService';
import {config} from '../config';
import IORedis from 'ioredis';

const workerConnection = new IORedis(config.redisUrl);

const worker = new Worker(
  'audit-queue',
  async (job) => {
    const {reportId, accountId} = job.data as {reportId: string; accountId: string};
    const transactions = await stellarService.fetchTransactions(accountId);
    const auditResult = auditEngine.analyze(transactions);

    await prisma.auditReport.update({
      where: {id: reportId},
      data: {
        summary: auditResult.summary,
        findings: auditResult.findings as Prisma.JsonValue,
        status: 'COMPLETED',
      },
    });
  },
  {connection: workerConnection},
);

worker.on('completed', (job) => {
  console.log(`Audit job completed: ${job.id}`);
});

worker.on('failed', async (job, err) => {
  if (!job) return;
  await prisma.auditReport.update({
    where: {id: job.data.reportId},
    data: {
      summary: 'Audit failed',
      status: 'FAILED',
    },
  });
  console.error(`Audit job failed: ${job.id}`, err);
});
