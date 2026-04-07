import crypto from 'crypto';
import {RequestHandler} from 'express';

export const correlationIdMiddleware: RequestHandler = (req, _res, next) => {
  const correlationId = req.header('x-correlation-id') || crypto.randomUUID();
  req.headers['x-correlation-id'] = correlationId;
  next();
};
