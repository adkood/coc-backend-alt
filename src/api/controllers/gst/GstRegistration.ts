import { Request, Response } from 'express';
import { GstRegistrations } from '../../entity/gst/GstRegistrations';
import { AppDataSource } from '@/server';
import { Users } from '@/api/entity/user/Users';
import { Gstr1 } from '@/api/entity/gst/Gstr1';

interface AuthenticatedRequest extends Request {
    userId?: string,
    gstIn?: string,
}

export const createOrUpdateGstRegistration = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const gstRepo = AppDataSource.getRepository(GstRegistrations);
        const userRepo = AppDataSource.getRepository(Users);
        const userId = req.userId;
        const registrationData = req.body;

        let registration: any;

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

export const createGSTR1Entry = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const gstr1Repository = AppDataSource.getRepository(Gstr1);
        const userId = req.userId;
        const gstIn = req.gstIn;

        const gstr1Entry = await gstr1Repository.findOne({ where: { userId, gstIn, financialYear: req.body?.financialYear, month: req.body?.month } });

        if (gstr1Entry) {
            return res.status(400).json({ status: "fail", message: "Entry already present for this time period" });
        }

        console.log("entry :", req.body);

        const newEntry = gstr1Repository.create({
            ...req.body,
            userId,
            gstIn,
        });

        const savedEntry = await gstr1Repository.save(newEntry);

        return res.status(201).json({
            status: "success",
            message: 'GSTR1 entry created successfully',
            data: savedEntry
        });
    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to create GSTR1 entry',
            error: error.message
        });
    }
};

export const getSingleRegistration = async (req: AuthenticatedRequest, res: Response) => {

    try {
        const userId = req.userId;
        const gstIn = req.gstIn;
        const registrationRepo = AppDataSource.getRepository(GstRegistrations);

        if (!userId) {
            return res.status(400).json({ status: "success", message: "UserId is required" });
        }

        const userRegis = await registrationRepo.findOne({ where: { userId, gstIn } });

        return res.status(200).json({ status: "success", message: "Fetched gst registrations", data: { registration: userRegis } });

    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to create GSTR1 entry',
            error: error.message
        });
    }
}

export const getGSTR1Entry = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { financialYear, month } = req.query;
        const userId = req.userId;
        const gstIn = req.gstIn;
        const gstr1Repository = AppDataSource.getRepository(Gstr1);

        if (!gstIn || !userId) {
            return res.status(400).json({
                status: "error",
                message: 'gstIn and userId are required parameters'
            });
        }

        const queryBuilder = gstr1Repository.createQueryBuilder('entry')
            .where('entry.userId = :userId', { userId })
            .andWhere('entry.gstIn = :gstIn', { gstIn });

        if (financialYear) {
            queryBuilder.andWhere('entry.financialYear = :financialYear', { financialYear });
        }

        if (month) {
            queryBuilder.andWhere('entry.month = :month', { month });
        }

        const entry = await queryBuilder.getOne();

        if (!entry) {
            return res.status(404).json({
                status: "error",
                message: 'No GSTR1 entry found'
            });
        }

        return res.status(200).json({
            status: "success",
            message: 'GSTR1 entry retrieved successfully',
            data: { entry }
        });

    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to fetch GSTR1 entry',
            error: error.message
        });
    }
};

export const getGSTR1Entries = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const gstIn = req.gstIn;
        const gstr1Repository = AppDataSource.getRepository(Gstr1);

        const entries = await gstr1Repository.find({
            where: {
                gstIn,
                userId
            },
            order: {
                createdAt: 'ASC'
            }
        });

        return res.status(200).json({
            status: "success",
            message: 'GSTR1 entry retrieved successfully',
            data: { gstr1Entries: entries }
        });

    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to fetch GSTR1 entry',
            error: error.message
        });
    }
};

export function generateAllPeriodsSince(startDate: Date) {
    const periods = [];
    const currentDate = new Date();

    // GST financial year runs from April to March
    const getFinancialYear = (date: Date) => {
        const year = date.getFullYear();
        return date.getMonth() >= 3 ?  // April (month 3) or later
            `${year}-${(year + 1).toString().slice(2)}` :
            `${year - 1}-${year.toString().slice(2)}`;
    };

    // GST quarter mapping
    const getQuarter = (month: number) => {
        if (month >= 3 && month <= 5) return 'Q1';  // Apr-Jun
        if (month >= 6 && month <= 8) return 'Q2';  // Jul-Sep
        if (month >= 9 && month <= 11) return 'Q3'; // Oct-Dec
        return 'Q4';                                // Jan-Mar
    };

    // Month names for display
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Start from the beginning of the start month
    const date = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

    while (date <= currentDate) {
        const month = date.getMonth();
        const monthStr = (month + 1).toString().padStart(2, '0'); // 01-12

        periods.push({
            financialYear: getFinancialYear(date),
            quarter: getQuarter(month),
            month: monthStr,
            monthName: monthNames[month]
        });

        // Move to next month
        date.setMonth(date.getMonth() + 1);
    }

    return periods;
}

export const getSuggestedGSTR1Period = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const gstIn = req.gstIn;
        const gstr1Repository = AppDataSource.getRepository(Gstr1);

        // 1. Generate all possible periods since Jan 2024
        const allPeriods = generateAllPeriodsSince(new Date(2024, 3, 1));

        // 2. Get just the existing period keys in one query
        const existingPeriods = await gstr1Repository
            .createQueryBuilder('gstr1')
            .select("CONCAT(gstr1.financialYear, '-', gstr1.quarter, '-', gstr1.month)", "periodKey")
            .where({ gstIn, userId })
            .getRawMany();

        const existingKeys = existingPeriods.map(p => p.periodKey);

        // 3. Find the first missing period
        const suggestedPeriod = allPeriods.find(period => {
            const periodKey = `${period.financialYear}-${period.quarter}-${period.month}`;
            return !existingKeys.includes(periodKey);
        });

        if (!suggestedPeriod) {
            return res.status(200).json({
                status: "success",
                message: 'All GSTR1 periods since January 2024 have been filed',
                data: { suggestedPeriod: null }
            });
        }

        return res.status(200).json({
            status: "success",
            message: 'Suggested GSTR1 period found',
            data: { suggestedPeriod }
        });

    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to determine suggested GSTR1 period',
            error: error.message
        });
    }
};