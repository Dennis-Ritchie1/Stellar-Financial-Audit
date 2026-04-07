import {Router} from 'express';
import {authenticate} from '../middleware/authMiddleware';
import {runAudit, getAuditReport} from '../controllers/auditController';

export const auditRouter = Router();

auditRouter.post('/run', authenticate, runAudit);
auditRouter.get('/report/:id', authenticate, getAuditReport);
