import { Users } from '@/api/entity/user/Users';
import { AppDataSource } from '@/server';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  userId?: string;
  gstIn?: string;
}

// export const authenticate = (req: Request, res: Response, next: NextFunction) => {
//   // Get token from cookies instead of Authorization header
//   const accessToken = req.cookies?.token;

//   console.log(req.cookies);

//   if (!accessToken) {
//     return res.status(401).json({ 
//       status: 'error', 
//       message: 'You are not logged in' 
//     });
//   }

//   jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY || '', (err: any, payload: any) => {
//     if (err) {

//       res.clearCookie('token');
//       return res.status(403).json({ 
//         status: 'error', 
//         message: 'Session expired, please login again' 
//       });
//     }

//     if (!payload || !payload.id) {
//       res.clearCookie('token');
//       return res.status(403).json({ 
//         status: 'error', 
//         message: 'Invalid session' 
//       });
//     }

//     (req as AuthenticatedRequest).userId = payload.id;
//     next();
//   });
// };

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const accessToken = req.cookies?.token;

  if (!accessToken) {
    return res.status(401).json({
      status: 'error',
      message: 'You are not logged in'
    });
  }

  try {
    const payload = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY || '') as any;

    if (!payload || !payload.id || !payload.sessionToken) {
      res.clearCookie('token');
      return res.status(403).json({
        status: 'error',
        message: 'Invalid session'
      });
    }

    const userRepository = AppDataSource.getRepository(Users);
    const user = await userRepository.findOne({
      where: { id: payload.id },
      select: ['id', 'currentSessionToken']
    });

    if (!user) {
      res.clearCookie('token');
      return res.status(403).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.currentSessionToken !== payload.sessionToken) {
      res.clearCookie('token');
      return res.status(403).json({
        status: 'error',
        message: 'Session expired (logged in elsewhere)'
      });
    }

    (req as AuthenticatedRequest).userId = payload.id;
    next();
  } catch (err) {
    // Clear the token cookie
    res.clearCookie('token');

    // If the error is because of token expiration
    if (err instanceof jwt.TokenExpiredError) {
      try {
        // Get the expired payload without verification
        const expiredPayload = jwt.decode(accessToken) as any;

        if (expiredPayload?.id) {
          // Reset the currentSessionToken for this user
          const userRepository = AppDataSource.getRepository(Users);
          await userRepository.update(expiredPayload.id, { currentSessionToken: null });
        }
      } catch (dbError) {
        console.error('Failed to clear session token:', dbError);
      }
    }

    return res.status(403).json({
      status: 'error',
      message: 'Session expired, please login again'
    });
  }
};

export const gstAuthenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.userId) {
    return res.status(401).json({
      status: 'error',
      message: 'User not authenticated'
    });
  }

  const gstIn = req.cookies.gstIn;

  if (!gstIn) {
    return res.status(401).json({
      status: 'error',
      message: 'GSTIn required'
    });
  }

  try {

    // Verify GSTIN belongs to user
    const userRepo = AppDataSource.getRepository(Users);
    const user = await userRepo.findOne({
      where: { id: authReq.userId },
      select: ['id', 'gstIns']
    });

    if (!user || !user.gstIns || !user.gstIns.includes(gstIn)) {
      res.clearCookie('gstToken');
      return res.status(403).json({
        status: 'error',
        message: 'GSTIN not registered to this user'
      });
    }

    authReq.gstIn = gstIn;
    next();

  } catch (err) {
    res.clearCookie('gstToken');
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired GST session'
    });
  }
};