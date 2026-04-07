import {RequestHandler} from 'express';
import {logger} from '../utils/logger';

export const loggingMiddleware: RequestHandler = (req, res, next) => {
  const correlationId = req.headers['x-correlation-id'];
  const requestLogger = logger.child({correlationId, method: req.method, path: req.path});

  requestLogger.info({query: req.query, body: req.body}, 'Incoming request');
  res.on('finish', () => {
    requestLogger.info({statusCode: res.statusCode}, 'Request completed');
  });

  next();
};
