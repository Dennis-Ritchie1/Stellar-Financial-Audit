import {ErrorRequestHandler} from 'express';
import {logger} from '../utils/logger';

export const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
  logger.error({err, path: req.path}, 'Request error');
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
};
