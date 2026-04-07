import {Router} from 'express';
import {authRouter} from './authRoutes';
import {transactionRouter} from './transactionRoutes';
import {auditRouter} from './auditRoutes';

export const router = Router();

router.use('/auth', authRouter);
router.use('/transactions', transactionRouter);
router.use('/audit', auditRouter);
