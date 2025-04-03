import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';


interface AuthenticatedRequest extends Request {
  userId?: string;
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'You are not logged in' });
  }

  const accessToken = authHeader.split(' ')[1];

  jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY || '', (err, payload: any) => {
    if (err) {
      return res.status(403).json({ status: 'error', message: 'Need to login again' });
    }

    if (!payload || !payload.id) {
      return res.status(403).json({ status: 'error', message: 'Invalid token' });
    }

    // Explicitly cast req as AuthenticatedRequest to allow adding userId
    (req as AuthenticatedRequest).userId = payload.id;

    console.log('authentication payload: ', payload);
    next();
  });
};