import {Response, NextFunction, Request} from 'express';
import {AuthRequest} from '../types';
import * as auditService from '../services/auditService';

export const runAudit = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {accountId} = req.body;
    const report = await auditService.queueAudit({accountId, userId: req.user?.sub});
    res.status(202).json(report);
  } catch (error) {
    next(error);
  }
};

export const getAuditReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {id} = req.params;
    const report = await auditService.getReportById(id);
    res.json(report);
  } catch (error) {
    next(error);
  }
};
