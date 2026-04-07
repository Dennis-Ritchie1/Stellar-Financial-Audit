import jwt from 'jsonwebtoken';
import {config} from '../config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export const signJwt = (payload: Omit<JwtPayload, 'sub'> & {sub: string}) => {
  return jwt.sign(payload, config.jwtSecret, {expiresIn: '8h'});
};

export const verifyJwt = (token: string): JwtPayload => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};
