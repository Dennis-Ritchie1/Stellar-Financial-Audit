import app from './app';
import {config} from './config';
import {logger} from './utils/logger';
import './jobs/auditWorker';

const port = config.port;

app.listen(port, () => {
  logger.info({port}, 'Stellar Financial Audit service started');
});
