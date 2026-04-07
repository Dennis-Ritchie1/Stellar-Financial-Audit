import {Request, Response, NextFunction} from 'express';
import * as transactionService from '../services/transactionService';

export const getTransactionsByAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {accountId} = req.params;
    const transactions = await transactionService.fetchAndSaveTransactions(accountId);
    res.json({accountId, transactions});
  } catch (error) {
    next(error);
  }
};
