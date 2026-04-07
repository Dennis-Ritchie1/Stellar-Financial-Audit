import {NextFunction, Response} from 'express';
import {verifyJwt} from '../utils/jwt';
import {AuthRequest} from '../types';

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({message: 'Missing or invalid authorization header'});
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    req.user = verifyJwt(token);
    next();
  } catch (error) {
    return res.status(401).json({message: 'Invalid or expired token'});
  }
};
