import { Request, Response } from 'express';
import { GstRegistrations } from '../../entity/gst/GstRegistrations';
import { AppDataSource } from '@/server';
import { Users } from '@/api/entity/user/Users';

interface AuthenticatedRequest extends Request {
    userId?: string,
    gstIn? : string,
}

export const createOrUpdateGstRegistration = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const gstRepo = AppDataSource.getRepository(GstRegistrations);
        const userRepo = AppDataSource.getRepository(Users);
        const userId = req.userId;
        const registrationData = req.body;

        let registration: any;

        console.log("******************ID******************", registrationData?.id);
        if (registrationData && registrationData.id) {
            registration = await gstRepo.findOne({
                where: { id: registrationData.id, userId }
            });

            if (!registration) {
                return res.status(404).json({
                    success: "fail",
                    message: 'GST registration not found'
                });
            }

            gstRepo.merge(registration, registrationData);
            registration.updatedBy = 'system';
        } else {
            registration = gstRepo.create({
                ...registrationData,
                userId,
                createdBy: 'system'
            });
        }
        console.log(registration);
        const result = await gstRepo.save(registration);

        if (registrationData?.gstIn) {
            const user = await userRepo.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ success: "error", message: 'User not found' });
            }

            if (!user.gstIns) {
                user.gstIns = [];
            }

            if (user?.gstIns?.length < 2 && !user.gstIns.includes(registrationData.gstIn)) {
                user.gstIns.push(registrationData.gstIn);
                await userRepo.save(user);
            }
        }

        return res.status(200).json({
            success: "success",
            message: registrationData?.id
                ? 'GST registration updated successfully'
                : 'GST registration created successfully',
            data: result
        });

    } catch (error: any) {
        console.error('Error in createOrUpdateGstRegistration:', error);
        return res.status(500).json({
            success: "error",
            message: 'Failed to process GST registration',
            error: error.message
        });
    }
};

export const getGstIns = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const userRepo = AppDataSource.getRepository(Users);
        const user = await userRepo.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ success: "error", message: 'User not found' });
        }
        res.status(200).json({ status: "success", message: "All GstIns recieved", data: { gstIns: user?.gstIns } });
    }
    catch (error: any) {
        return res.status(500).json({
            success: "error",
            message: 'Failed to process GST registration',
            error: error.message
        });
    }
}