import { Users } from '@/api/entity/user/Users';
import { AppDataSource } from '@/server';
import { Request, Response } from 'express';


interface AuthenticatedRequest extends Request {
  userId?: string,
  gstIn?: string,
}

// export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
//   try {
//     const userId = req.userId;

//     if (!userId) {
//       res.status(400).json({ status: 'error', message: 'UserId is required' });
//       return;
//     }

//     res.clearCookie('token');
//     res.clearCookie('gstIn');

//     res.status(200).json({ status: 'success', message: 'Logged out successfully' });
//   } catch (error) {
//     console.error('Error logging out:', error);
//     res.status(500).json({ status: 'error', message: 'Failed to log out' });
//   }
// };


export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(400).json({ status: 'error', message: 'UserId is required' });
      return;
    }

    // Clear the session token in database
    const userRepository = AppDataSource.getRepository(Users);
    await userRepository.update(userId, { 
      currentSessionToken: null,
      lastLoginAt: new Date() // Optional: track last logout time
    });

    // Clear cookies
    res.clearCookie('token');
    res.clearCookie('gstIn');

    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ status: 'error', message: 'Failed to log out' });
  }
};