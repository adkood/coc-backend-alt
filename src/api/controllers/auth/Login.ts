import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '@/server';
import { Users } from '@/api/entity/user/Users';
import { randomBytes } from 'crypto';

const generateAccessToken = (user: { id: string, sessionToken: string }, rememberMe: boolean = false): string => {
  return jwt.sign({ id: user.id, sessionToken: user.sessionToken }, process.env.ACCESS_SECRET_KEY!, {
    expiresIn: rememberMe ? process.env.JWT_ACCESS_EXPIRES_IN_REMEMBER : process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

// const generateRefreshToken = (user: { id: string }, rememberMe: boolean = false): string => {
//   return jwt.sign({ id: user.id }, process.env.REFRESH_SECRET_KEY!, {
//     expiresIn: rememberMe ? process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER : process.env.JWT_REFRESH_EXPIRES_IN,
//   });
// };

// export const login = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password, rememberMe = false } = req.body;
//     const { token } = req.query;

//     if (!email || !password) {
//       res.status(400).json({
//         status: 'fail',
//         message: 'Please provide an email and password.',
//       });
//       return;
//     }

//     const userLoginRepository = AppDataSource.getRepository(Users);
//     let user: Users | null = null;

//     if (token) {
//       // Handle token-based verification
//       let payload: any;
//       try {
//         payload = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!);
//       } catch (err) {
//         console.log(err);
//         res.status(400).json({
//           status: 'error',
//           message: 'Invalid or expired token.',
//         });
//         return;
//       }

//       const { userId } = payload;
//       user = await userLoginRepository.findOne({ where: { id: userId }, select: ['id','gstIns' ,'emailAddress', 'mobileNumber', 'firstName', 'lastName', 'enrollmentNumber', 'enrollmentType'] });

//       if (!user) {
//         res.status(404).json({
//           status: 'error',
//           message: 'User not found.',
//         });
//         return;
//       }

//       if (user.active === 0) {
//         user.active = 1; // Activate user
//         await userLoginRepository.save(user);
//       }
//     } else {
//       // Find the user by email for regular login
//       user = await userLoginRepository.findOne({ where: { emailAddress: email } });

//       if (!user || !(await Users.validatePassword(password, user.password))) {
//         res.status(401).json({
//           status: 'error',
//           message: 'Invalid email or password.',
//         });
//         return;
//       }
//     }

//     const accessToken = generateAccessToken(user, rememberMe);

//     // for development
//     const cookieOptions: any = {
//       httpOnly: true,
//       secure: false,
//       sameSite: 'lax',
//       path: '/',
//     };

//     // for production
//     // const cookieOptions: any = {
//     //   httpOnly: true,
//     //   secure: true, 
//     //   sameSite: 'none',
//     //   path: '/',
//     // };

//     res.cookie('token', accessToken, cookieOptions);

//     res.status(200).json({
//       status: 'success',
//       message: 'Logged in successfully.',
//       data: {
//         accessToken,
//         user,
//       },
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Something went wrong! Please try again later.',
//     });
//   }
// };

// export const login = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { email, password, rememberMe = false } = req.body;
//     const { token } = req.query;
//     const deviceInfo = req.headers['user-agent'];
//     const ipAddress = req.ip;

//     if (!email || !password) {
//       res.status(400).json({
//         status: 'fail',
//         message: 'Please provide an email and password.',
//       });
//       return;
//     }

//     const userLoginRepository = AppDataSource.getRepository(Users);
//     let user: Users | null = null;

//     if (token) {
//       // Handle token-based verification
//       let payload: any;
//       try {
//         payload = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!);
//       } catch (err) {
//         console.log(err);
//         res.status(400).json({
//           status: 'error',
//           message: 'Invalid or expired token.',
//         });
//         return;
//       }

//       const { userId } = payload;
//       user = await userLoginRepository.findOne({
//         where: { id: userId },
//         select: ['id', 'gstIns', 'emailAddress', 'mobileNumber', 'firstName', 'lastName', 'enrollmentNumber', 'enrollmentType', 'currentSessionToken']
//       });

//       if (!user) {
//         res.status(404).json({
//           status: 'error',
//           message: 'User not found.',
//         });
//         return;
//       }

//       if (user.active === 0) {
//         user.active = 1; // Activate user
//         await userLoginRepository.save(user);
//       }
//     } else {
//       // Find the user by email for regular login
//       user = await userLoginRepository.findOne({
//         where: { emailAddress: email },
//         select: ['id', 'password', 'gstIns', 'emailAddress', 'mobileNumber', 'firstName', 'lastName', 'enrollmentNumber', 'enrollmentType', 'currentSessionToken']
//       });

//       if (!user || !(await Users.validatePassword(password, user.password))) {
//         res.status(401).json({
//           status: 'error',
//           message: 'Invalid email or password.',
//         });
//         return;
//       }

//       // Check if user already has an active session
//       if (user.currentSessionToken) {
//         res.status(403).json({
//           status: 'error',
//           message: 'You are already logged in on another device. Please logout there first or wait for the session to expire.',
//         });
//         return;
//       }
//     }

//     // Generate a unique session token
//     const sessionToken = randomBytes(32).toString('hex');

//     // Update user with session info
//     user.currentSessionToken = sessionToken;
//     user.lastLoginDevice = deviceInfo || null;
//     user.lastLoginIp = ipAddress || null;
//     user.lastLoginAt = new Date();
//     await userLoginRepository.save(user);

//     // Include sessionToken in the JWT payload
//     const accessToken = generateAccessToken({
//       ...user,
//       sessionToken // Include this in your JWT payload
//     }, rememberMe);

//     // Set cookie
//     const cookieOptions: any = {
//       httpOnly: true,
//       secure: false,
//       sameSite: 'lax',
//       path: '/',
//     };

//     res.cookie('token', accessToken, cookieOptions);

//     res.status(200).json({
//       status: 'success',
//       message: 'Logged in successfully.',
//       data: {
//         accessToken,
//         user: {
//           id: user.id,
//           emailAddress: user.emailAddress,
//           mobileNumber: user.mobileNumber,
//           firstName: user.firstName,
//           lastName: user.lastName,
//           enrollmentNumber: user.enrollmentNumber,
//           enrollmentType: user.enrollmentType,
//           gstIns: user.gstIns
//         },
//       },
//     });

//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({
//       status: 'error',
//       message: 'Something went wrong! Please try again later.',
//     });
//   }
// };

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const { token } = req.query;
    const deviceInfo = req.headers['user-agent'];
    const ipAddress = req.ip;

    if (!email || !password) {
      res.status(400).json({
        status: 'fail',
        message: 'Please provide an email and password.',
      });
      return;
    }

    const userLoginRepository = AppDataSource.getRepository(Users);
    let user: Users | null = null;

    if (token) {
      // Handle token-based verification
      let payload: any;
      try {
        payload = jwt.verify(token as string, process.env.ACCESS_SECRET_KEY!);
      } catch (err) {
        console.log(err);
        res.status(400).json({
          status: 'error',
          message: 'Invalid or expired token.',
        });
        return;
      }

      const { userId } = payload;
      user = await userLoginRepository.findOne({
        where: { id: userId },
        select: ['id', 'gstIns', 'emailAddress', 'mobileNumber', 'firstName', 'lastName', 'enrollmentNumber', 'enrollmentType', 'currentSessionToken']
      });

      if (!user) {
        res.status(404).json({
          status: 'error',
          message: 'User not found.',
        });
        return;
      }

      if (user.active === 0) {
        user.active = 1; // Activate user
        await userLoginRepository.save(user);
      }
    } else {
      // Find the user by email for regular login
      user = await userLoginRepository.findOne({
        where: { emailAddress: email },
        select: ['id', 'password', 'gstIns', 'emailAddress', 'mobileNumber', 'firstName', 'lastName', 'enrollmentNumber', 'enrollmentType', 'currentSessionToken']
      });

      if (!user || !(await Users.validatePassword(password, user.password))) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password.',
        });
        return;
      }

      // Invalidate any existing session by setting currentSessionToken to null
      if (user.currentSessionToken) {
        await userLoginRepository.update(user.id, { currentSessionToken: null });
      }
    }

    // Generate a unique session token
    const sessionToken = randomBytes(32).toString('hex');

    // Update user with session info
    user.currentSessionToken = sessionToken;
    user.lastLoginDevice = deviceInfo || null;
    user.lastLoginIp = ipAddress || null;
    user.lastLoginAt = new Date();
    await userLoginRepository.save(user);

    // Include sessionToken in the JWT payload
    const accessToken = generateAccessToken({
      ...user,
      sessionToken // Include this in your JWT payload
    }, rememberMe);

    // Set cookie
    // const cookieOptions: any = {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'lax',
    //   path: '/',
    // };

    const cookieOptions: any = {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      // domain: "cfmpractice.coceducation.com"
    };

    res.cookie('token', accessToken, cookieOptions);

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        accessToken,
        user: {
          id: user.id,
          emailAddress: user.emailAddress,
          mobileNumber: user.mobileNumber,
          firstName: user.firstName,
          lastName: user.lastName,
          enrollmentNumber: user.enrollmentNumber,
          enrollmentType: user.enrollmentType,
          gstIns: user.gstIns
        },
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong! Please try again later.',
    });
  }
};

interface AuthenticatedRequest extends Request {
  userId?: string,
  gstIn?: string
}

export const gstLogin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { gstIn } = req.body;

    if (!userId || !gstIn) {
      return res.status(400).json({
        success: "fail",
        message: 'User ID and GSTIN are required'
      });
    }

    const userRepo = AppDataSource.getRepository(Users);
    const user = await userRepo.findOne({
      where: { id: userId }
    });

    if (!user) {
      return res.status(400).json({
        success: "fail",
        message: 'User not found'
      });
    }

    if (!user.gstIns || !user.gstIns.includes(gstIn)) {
      return res.status(403).json({
        success: "fail",
        message: 'This GSTIN is not registered with this user'
      });
    }

    const cookieOptions: any = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    };

    res.cookie('gstIn', gstIn, cookieOptions);


    return res.status(200).json({
      success: "success",
      message: 'GST authentication successful',
      gstIn: gstIn,
    });

  } catch (error: any) {
    console.error('Error in gstLogin:', error);
    return res.status(500).json({
      success: "error",
      message: 'Internal server error',
      error: error.message
    });
  }
};
