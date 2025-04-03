import { Request, Response } from 'express';
import { Users } from '@/api/entity/user/Users'; 

interface AuthenticatedRequest extends Request {
    userId?: string
}

export const updateTRN = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { trn } = req.body;

        if (!trn) {
            return res.status(400).json({ status: "error", message: 'TRN is required' });
        }

        const user = await Users.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ status: "error", message: 'User not found' });
        }

        user.trn = trn;
        await user.save();

        return res.status(200).json({ status: "success", message: 'TRN updated successfully', data: { trn } });
    } catch (error) {
        console.error('Error updating TRN:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const addGSTIN = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const { gstIn } = req.body;

        if (!gstIn) {
            return res.status(400).json({ message: 'GSTIN is required' });
        }

        const user = await Users.findOne({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ status: "error", message: 'User not found' });
        }

        if (!user.gstIns) {
            user.gstIns = [];
        }

        if (user.gstIns.length >= 2) {
            return res.status(200).json({ status: "success", message: 'Success', data: { gstIns: user.gstIns } });
        }

        user.gstIns.push(gstIn);
        await user.save();

        return res.status(200).json({ status: "success", message: 'GSTIN added successfully', data: { gstIns: user.gstIns } });
    } catch (error) {
        console.error('Error adding GSTIN:', error);
        return res.status(500).json({ status: "error", message: 'Internal server error' });
    }
};
