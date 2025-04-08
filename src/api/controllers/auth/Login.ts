import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '@/server';
import { Users } from '@/api/entity/user/Users';

const generateAccessToken = (user: { id: string }, rememberMe: boolean = false): string => {
  return jwt.sign({ id: user.id }, process.env.ACCESS_SECRET_KEY!, {
    expiresIn: rememberMe ? process.env.JWT_ACCESS_EXPIRES_IN_REMEMBER : process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

// const generateRefreshToken = (user: { id: string }, rememberMe: boolean = false): string => {
//   return jwt.sign({ id: user.id }, process.env.REFRESH_SECRET_KEY!, {
//     expiresIn: rememberMe ? process.env.JWT_REFRESH_EXPIRES_IN_REMEMBER : process.env.JWT_REFRESH_EXPIRES_IN,
//   });
// };

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe = false } = req.body;
    const { token } = req.query;

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
        res.status(400).json({
          status: 'error',
          message: 'Invalid or expired token.',
        });
        return;
      }

      const { userId } = payload;
      user = await userLoginRepository.findOne({ where: { id: userId } });

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
      user = await userLoginRepository.findOne({ where: { emailAddress: email } });

      if (!user || !(await Users.validatePassword(password, user.password))) {
        res.status(401).json({
          status: 'error',
          message: 'Invalid email or password.',
        });
        return;
      }
    }

    const accessToken = generateAccessToken(user, rememberMe);

    res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        accessToken,
        user,
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

export const gstLogin = async (req: Request, res: Response) => {
    try {
        const { userId, gstIn } = req.body;

        if (!userId || !gstIn) {
            return res.status(400).json({
                success: "fail",
                message: 'User ID and GSTIN are required'
            });
        }

        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOne({ 
            where: { id: userId },
            select: ['id', 'gstIns', 'userName', 'emailAddress'] // Only select needed fields
        });

        if (!user) {
            return res.status(404).json({
                success: "fail",
                message: 'User not found'
            });
        }

        // Check if GSTIN exists in user's gstIns array
        if (!user.gstIns || !user.gstIns.includes(gstIn)) {
            return res.status(403).json({
                success: "fail",
                message: 'This GSTIN is not registered with this user'
            });
        }

        // Create JWT token
        // const token = jwt.sign(
        //     { id: user.id, userName: user.userName, email: user.emailAddress },
        //     process.env.JWT_SECRET || 'your-secret-key',
        //     { expiresIn: '1h' }
        // );

        const accessToken = generateAccessToken(user);

        return res.status(200).json({
            success: "success",
            message: 'GST authentication successful',
            gstToken: accessToken,
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
