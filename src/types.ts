import {Request} from 'express';

export interface TransactionRecord {
  id: string;
  accountId?: string;
  amount: string;
  assetCode: string;
  memo?: string;
  sourceAccount: string;
  operationType: string;
  verified: boolean;
  rawJson: unknown;
}

export interface JwtUser {
  sub: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JwtUser;
}
