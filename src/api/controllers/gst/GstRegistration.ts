import { Request, Response } from 'express';
import { GstRegistrations } from '../../entity/gst/GstRegistrations';
import { AppDataSource } from '@/server';
import { Users } from '@/api/entity/user/Users';
import { Gstr1 } from '@/api/entity/gst/Gstr1';
import { Gstr3b } from '@/api/entity/gst/Gstr3b';

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

// -----------------------------------------------------GSTR3B----------------------------------------------------------

export const createGSTR3bEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const gstr3bRepository = AppDataSource.getRepository(Gstr3b);
        const userId = req.userId;
        const gstIn = req.gstIn;

        // Check if entry already exists for this period
        const existingEntry = await gstr3bRepository.findOne({ 
            where: { 
                userId, 
                gstIn, 
                financialYear: req.body.financialYear, 
                month: req.body.month 
            }
        });

        if (existingEntry) {
            return res.status(400).json({ 
                status: "fail", 
                message: "GSTR-3B entry already exists for this period" 
            });
        }

        // Create new entry
        const newEntry = gstr3bRepository.create({
            ...req.body,
            userId,
            gstIn,
            createdBy: userId,
            updatedBy: userId
        });

        const savedEntry = await gstr3bRepository.save(newEntry);

        return res.status(201).json({
            status: "success",
            message: 'GSTR-3B entry created successfully',
            data: savedEntry
        });
    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to create GSTR-3B entry',
            error: error.message
        });
    }
};

export const getGSTR3bEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { financialYear, month } = req.query;
        const userId = req.userId;
        const gstIn = req.gstIn;
        const gstr3bRepository = AppDataSource.getRepository(Gstr3b);

        if (!gstIn || !userId) {
            return res.status(400).json({
                status: "error",
                message: 'gstIn and userId are required parameters'
            });
        }

        // Build query with conditions
        const queryBuilder = gstr3bRepository.createQueryBuilder('entry')
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
                message: 'No GSTR-3B entry found'
            });
        }

        return res.status(200).json({
            status: "success",
            message: 'GSTR-3B entry retrieved successfully',
            data: { entry }
        });

    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to fetch GSTR-3B entry',
            error: error.message
        });
    }
};

export const getGSTR3bEntries = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const gstIn = req.gstIn;
        const gstr3bRepository = AppDataSource.getRepository(Gstr3b);

        const entries = await gstr3bRepository.find({
            where: {
                gstIn,
                userId
            },
            order: {
                financialYear: 'ASC',
                month: 'ASC'
            }
        });

        return res.status(200).json({
            status: "success",
            message: 'GSTR-3B entries retrieved successfully',
            data: { gstr3bEntries: entries }
        });

    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to fetch GSTR-3B entries',
            error: error.message
        });
    }
};

export const getSuggestedGSTR3bPeriod = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId;
        const gstIn = req.gstIn;
        const gstr3bRepository = AppDataSource.getRepository(Gstr3b);

        // 1. Generate all possible periods since Jan 2024
        const allPeriods = generateAllPeriodsSince(new Date(2024, 3, 1));

        // 2. Get existing periods in one query
        const existingPeriods = await gstr3bRepository
            .createQueryBuilder('gstr3b')
            .select("CONCAT(gstr3b.financialYear, '-', gstr3b.month)", "periodKey")
            .where({ gstIn, userId })
            .getRawMany();

        const existingKeys = existingPeriods.map(p => p.periodKey);

        // 3. Find the first missing period
        const suggestedPeriod = allPeriods.find(period => {
            const periodKey = `${period.financialYear}-${period.month}`;
            return !existingKeys.includes(periodKey);
        });

        if (!suggestedPeriod) {
            return res.status(200).json({
                status: "success",
                message: 'All GSTR-3B periods since January 2024 have been filed',
                data: { suggestedPeriod: null }
            });
        }

        return res.status(200).json({
            status: "success",
            message: 'Suggested GSTR-3B period found',
            data: { suggestedPeriod }
        });

    } catch (error: any) {
        return res.status(500).json({
            status: "error",
            message: 'Failed to determine suggested GSTR-3B period',
            error: error.message
        });
    }
};

export const getGstr1PurchaseCalculations = async (req: Request, res: Response) => {
    try {
        const { gstIn, financialYear, quarter, month } = req.query;
        
        if (!gstIn || !financialYear || !quarter || !month) {
            return res.status(400).json({
                status: 'fail',
                message: 'gstIn, financialYear, quarter and month are required parameters'
            });
        }

        const gstr1Repository = AppDataSource.getRepository(Gstr1);
        
        const whereConditions: any = { 
            financialYear: financialYear as string,
            quarter: quarter as string,
        };

        if (month) {
            whereConditions.month = month as string;
        }

        const gstr1Entries = await gstr1Repository.find({ where: whereConditions });

        if (gstr1Entries.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No GSTR-1 records found for the specified criteria'
            });
        }

        const calculations = {
            totalTaxableValue: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
            cess: 0,
            supplies: {
                b2b: { count: 0, value: 0 },
                b2c: { count: 0, value: 0 },
                exports: { count: 0, value: 0 },
                nilRated: { count: 0, value: 0 },
                creditNotes: { count: 0, value: 0 }
            },
            filteredCount: 0
        };

        gstr1Entries.forEach(entry => {
            // Process B2B - only if recipientGSTIN matches
            if (entry.b2b && entry.b2b?.recipientGSTIN === gstIn) {
                calculations.supplies.b2b.count++;
                calculations.supplies.b2b.value += parseFloat(entry.b2b.totalValue) || 0;
                processTaxValues(entry.b2b.taxableValues, entry.b2b.cessValues, calculations);
                calculations.filteredCount++;
            }

            // Process B2C (no recipient GSTIN to check)
            if (entry.b2c) {
                calculations.supplies.b2c.count++;
                calculations.supplies.b2c.value += parseFloat(entry.b2c.totalValue) || 0;
                processTaxValues(entry.b2c.taxableValues, entry.b2c.cessValues, calculations);
                calculations.filteredCount++;
            }

            // Process Exports (no recipient GSTIN to check)
            if (entry.exports) {
                calculations.supplies.exports.count++;
                calculations.supplies.exports.value += parseFloat(entry.exports.totalValue) || 0;
                processTaxValues(entry.exports.taxableValues, entry.exports.cessValues, calculations);
                calculations.filteredCount++;
            }

            // Process Nil Rated
            if (entry.nilRated) {
                calculations.supplies.nilRated.count++;
                calculations.filteredCount++;
            }

            // Process Credit Notes - only if recipientGSTIN matches
            if (entry.credit && entry.credit.recipientGSTIN === gstIn) {
                calculations.supplies.creditNotes.count++;
                calculations.supplies.creditNotes.value += parseFloat(entry.credit.noteValue) || 0;
                processTaxValues(entry.credit.taxableValues, entry.credit.cessValues, calculations);
                calculations.filteredCount++;
            }

            // Process HSN (no recipient GSTIN to check)
            if (entry.hsn) {
                calculations.totalTaxableValue += parseFloat(entry.hsn.taxableValue) || 0;
                calculations.igst += parseFloat(entry.hsn.integratedTax) || 0;
                calculations.cgst += parseFloat(entry.hsn.centralTax) || 0;
                calculations.sgst += parseFloat(entry.hsn.stateTax) || 0;
                calculations.cess += parseFloat(entry.hsn.cess) || 0;
                calculations.filteredCount++;
            }

            if (entry.suppliesThroughEco && entry.suppliesThroughEco?.gstin === gstIn) {
                // calculations.totalTaxableValue += parseFloat(entry.suppliesThroughEco.netValue) || 0;
                calculations.igst += parseFloat(entry.suppliesThroughEco.integratedTax) || 0;
                calculations.cgst += parseFloat(entry.suppliesThroughEco.centralTax) || 0;
                calculations.sgst += parseFloat(entry.suppliesThroughEco.stateTax) || 0;
                calculations.cess += parseFloat(entry.suppliesThroughEco.cess) || 0;
                calculations.filteredCount++;
            }

            // Process suppliesB2b - only if recipientGstin matches
            if (entry.suppliesB2b && entry.suppliesB2b.recipientGstin === gstIn) {
                // Add logic to process suppliesB2b data if needed
                calculations.filteredCount++;
            }
        });

        // Calculate total payable amount
        const totalPayable = calculations.igst + calculations.cgst + calculations.sgst + calculations.cess;

        return res.status(200).json({
            status: 'success',
            data: {
                gstIn,
                financialYear,
                quarter,
                month: month || 'All',
                totalRecords: gstr1Entries.length,
                filteredRecords: calculations.filteredCount,
                totalTaxableValue: calculations.totalTaxableValue.toFixed(2),
                taxes: {
                    igst: calculations.igst.toFixed(2),
                    cgst: calculations.cgst.toFixed(2),
                    sgst: calculations.sgst.toFixed(2),
                    cess: calculations.cess.toFixed(2),
                    totalPayable: totalPayable.toFixed(2)
                },
                supplies: calculations.supplies
            }
        });

    } catch (error) {
        console.error('Error calculating GSTR-3B values:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to calculate GSTR-3B values',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Helper function to process tax values
function processTaxValues(taxableValues: Record<string, string>, cessValues: Record<string, string>, calculations: any) {
    if (taxableValues) {
        Object.entries(taxableValues).forEach(([key, value]) => {
            const numValue = parseFloat(value) || 0;
            if (key.includes('IGST')) calculations.igst += numValue;
            if (key.includes('CGST')) calculations.cgst += numValue;
            if (key.includes('SGST') || key.includes('UTGST')) calculations.sgst += numValue;
        });
    }

    if (cessValues) {
        Object.values(cessValues).forEach((value: any) => {
            calculations.cess += parseFloat(value) || 0;
        });
    }
}


export const getGstr1SalesCalculations = async (req: Request, res: Response) => {
    try {
        const { gstIn, financialYear, quarter, month } = req.query;
        
        if (!gstIn || !financialYear || !quarter || !month) {
            return res.status(400).json({
                status: 'fail',
                message: 'gstIn, financialYear, quarter and month are required parameters'
            });
        }

        const gstr1Repository = AppDataSource.getRepository(Gstr1);
        
        const whereConditions: any = { 
            gstIn: gstIn as string,
            financialYear: financialYear as string,
            quarter: quarter as string,
        };

        if (month) {
            whereConditions.month = month as string;
        }

        const gstr1Entries = await gstr1Repository.find({ where: whereConditions });

        if (gstr1Entries.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'No GSTR-1 records found for the specified criteria'
            });
        }

        const calculations = {
            totalTaxableValue: 0,
            igst: 0,
            cgst: 0,
            sgst: 0,
            cess: 0,
            supplies: {
                b2b: { count: 0, value: 0 },
                b2c: { count: 0, value: 0 },
                exports: { count: 0, value: 0 },
                nilRated: { count: 0, value: 0 },
                creditNotes: { count: 0, value: 0 }
            },
            filteredCount: 0
        };

        gstr1Entries.forEach(entry => {
            // Process B2B - only if recipientGSTIN matches
            if (entry.b2b) {
                calculations.supplies.b2b.count++;
                calculations.supplies.b2b.value += parseFloat(entry.b2b.totalValue) || 0;
                processTaxValues(entry.b2b.taxableValues, entry.b2b.cessValues, calculations);
                calculations.filteredCount++;
            }

            // Process B2C (no recipient GSTIN to check)
            if (entry.b2c) {
                calculations.supplies.b2c.count++;
                calculations.supplies.b2c.value += parseFloat(entry.b2c.totalValue) || 0;
                processTaxValues(entry.b2c.taxableValues, entry.b2c.cessValues, calculations);
                calculations.filteredCount++;
            }

            // Process Exports (no recipient GSTIN to check)
            if (entry.exports) {
                calculations.supplies.exports.count++;
                calculations.supplies.exports.value += parseFloat(entry.exports.totalValue) || 0;
                processTaxValues(entry.exports.taxableValues, entry.exports.cessValues, calculations);
                calculations.filteredCount++;
            }

            // Process Nil Rated
            if (entry.nilRated) {
                calculations.supplies.nilRated.count++;
                calculations.filteredCount++;
            }

            // Process Credit Notes - only if recipientGSTIN matches
            if (entry.credit) {
                calculations.supplies.creditNotes.count++;
                calculations.supplies.creditNotes.value += parseFloat(entry.credit.noteValue) || 0;
                processTaxValues(entry.credit.taxableValues, entry.credit.cessValues, calculations);
                calculations.filteredCount++;
            }

            // Process HSN (no recipient GSTIN to check)
            if (entry.hsn) {
                calculations.totalTaxableValue += parseFloat(entry.hsn.taxableValue) || 0;
                calculations.igst += parseFloat(entry.hsn.integratedTax) || 0;
                calculations.cgst += parseFloat(entry.hsn.centralTax) || 0;
                calculations.sgst += parseFloat(entry.hsn.stateTax) || 0;
                calculations.cess += parseFloat(entry.hsn.cess) || 0;
                calculations.filteredCount++;
            }

            if (entry.suppliesThroughEco && entry.suppliesThroughEco?.gstin === gstIn) {
                // calculations.totalTaxableValue += parseFloat(entry.suppliesThroughEco.netValue) || 0;
                calculations.igst += parseFloat(entry.suppliesThroughEco.integratedTax) || 0;
                calculations.cgst += parseFloat(entry.suppliesThroughEco.centralTax) || 0;
                calculations.sgst += parseFloat(entry.suppliesThroughEco.stateTax) || 0;
                calculations.cess += parseFloat(entry.suppliesThroughEco.cess) || 0;
                calculations.filteredCount++;
            }

            // Process suppliesB2b - only if recipientGstin matches
            if (entry.suppliesB2b) {
                // Add logic to process suppliesB2b data if needed
                calculations.filteredCount++;
            }
        });

        // Calculate total payable amount
        const totalPayable = calculations.igst + calculations.cgst + calculations.sgst + calculations.cess;

        return res.status(200).json({
            status: 'success',
            data: {
                gstIn,
                financialYear,
                quarter,
                month: month || 'All',
                totalRecords: gstr1Entries.length,
                filteredRecords: calculations.filteredCount,
                totalTaxableValue: calculations.totalTaxableValue.toFixed(2),
                taxes: {
                    igst: calculations.igst.toFixed(2),
                    cgst: calculations.cgst.toFixed(2),
                    sgst: calculations.sgst.toFixed(2),
                    cess: calculations.cess.toFixed(2),
                    totalPayable: totalPayable.toFixed(2)
                },
                supplies: calculations.supplies
            }
        });

    } catch (error) {
        console.error('Error calculating GSTR-3B values:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to calculate GSTR-3B values',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};