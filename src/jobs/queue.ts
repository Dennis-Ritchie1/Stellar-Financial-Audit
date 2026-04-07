import {Queue} from 'bullmq';
import IORedis from 'ioredis';
import {config} from '../config';

const connection = new IORedis(config.redisUrl);

export const auditQueue = new Queue('audit-queue', {
  connection,
});
