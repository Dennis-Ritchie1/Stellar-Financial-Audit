import express from 'express';
import {logger} from './utils/logger';
import {correlationIdMiddleware} from './middleware/correlationIdMiddleware';
import {loggingMiddleware} from './middleware/loggingMiddleware';
import {errorMiddleware} from './middleware/errorMiddleware';
import {router} from './routes';

const app = express();

app.use(express.json());
app.use(correlationIdMiddleware);
app.use(loggingMiddleware);

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({status: 'ok', service: 'stellar-financial-audit'});
});

app.use('/api', router);
app.use(errorMiddleware);

app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({message: 'Endpoint not found'});
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error({reason}, 'Unhandled rejection');
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  logger.fatal({error}, 'Uncaught exception');
  process.exit(1);
});

export default app;
