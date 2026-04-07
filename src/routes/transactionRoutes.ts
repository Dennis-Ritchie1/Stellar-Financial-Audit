import {Router} from 'express';
import {authenticate} from '../middleware/authMiddleware';
import {getTransactionsByAccount} from '../controllers/transactionController';

export const transactionRouter = Router();

transactionRouter.get('/:accountId', authenticate, getTransactionsByAccount);
