import { Users } from '@/api/entity/user/Users';
import { AppDataSource } from '@/server';
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

export const gstAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;

  // 1. First check if user is authenticated
  if (!authReq.userId) {
    return res.status(401).json({ status: 'error', message: 'User not authenticated' });
  }

  const gstHeader: any = req.headers['gst-auth'];
  if (!gstHeader || !gstHeader.startsWith('GST ')) {
    return res.status(401).json({
      status: 'error',
      message: 'GST authentication required'
    });
  }

  const gstToken = gstHeader.split(' ')[1];

  try {
    // 3. Verify GST token
    const payload: any = jwt.verify(gstToken, process.env.GST_SECRET_KEY || '');
    if (!payload || !payload.gstIn) {
      return res.status(403).json({ status: 'error', message: 'Invalid GST token' });
    }

    // 4. Verify GSTIN belongs to user
    const userRepo = AppDataSource.getRepository(Users);
    const user = await userRepo.findOne({
      where: { id: authReq.userId },
      select: ['id', 'gstIns']
    });

    if (!user || !user.gstIns || !user.gstIns.includes(payload.gstIn)) {
      return res.status(403).json({
        status: 'error',
        message: 'GSTIN not registered to this user'
      });
    }

    // 5. Attach GSTIN to request
    authReq.userId = payload.gstIn;
    next();

  } catch (err) {
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired GST token'
    });
  }
};
