import {Request, Response, NextFunction} from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {email, password} = req.body;
    const user = await authService.registerUser(email, password);
    res.status(201).json({id: user.id, email: user.email, role: user.role});
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {email, password} = req.body;
    const token = await authService.authenticateUser(email, password);
    res.json({token});
  } catch (error) {
    next(error);
  }
};
