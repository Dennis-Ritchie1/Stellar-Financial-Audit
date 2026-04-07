import {prisma} from '../config/prismaClient';
import {auditQueue} from '../jobs/queue';

interface QueueAuditPayload {
  accountId: string;
  userId?: string;
}

export const queueAudit = async ({accountId, userId}: QueueAuditPayload) => {
  const report = await prisma.auditReport.create({
    data: {
      accountId,
      summary: 'Queued for audit',
      findings: [],
      status: 'PENDING',
      userId,
    },
  });

  await auditQueue.add('run-audit', {reportId: report.id, accountId});

  return report;
};

export const getReportById = async (id: string) => {
  const report = await prisma.auditReport.findUnique({where: {id}});
  if (!report) {
    throw new Error('Audit report not found');
  }
  return report;
};
