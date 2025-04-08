import { Request, Response } from 'express';
import { GstRegistrations } from '../../entity/gst/GstRegistrations';
import { AppDataSource } from '@/server';

interface AuthenticatedRequest extends Request {
    userId ?: string
}

export const createOrUpdateGstRegistration = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const gstRepo = AppDataSource.getRepository(GstRegistrations);
        const registrationData = req.body;

        const userId = req.userId;
        
        // Validate required fields
        if (!registrationData.businessName || !registrationData.pan) {
            return res.status(400).json({
                success: false,
                message: 'Business name and PAN are required fields'
            });
        }

        let registration: any;
        
        if (registrationData.id) {
            // Update existing record
            registration = await gstRepo.findOne(registrationData.id);
            
            if (!registration) {
                return res.status(404).json({
                    success: false,
                    message: 'GST registration not found'
                });
            }
            
            gstRepo.merge(registration, registrationData);
            registration.updatedBy = userId || 'system'; 
        } else {
            registration = gstRepo.create(registrationData);
            registration.createdBy = userId || 'system';
        }

        const result = await gstRepo.save(registration);
        
        res.status(200).json({
            success: true,
            message: registrationData.id ? 'GST registration updated successfully' : 'GST registration created successfully',
            data: result
        });

    } catch (error: any) {
        console.error('Error in createOrUpdateGstRegistration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process GST registration',
            error: error.message
        });
    }
};

// Additional helper controller for getting a registration
// export const getGstRegistration = async (req: Request, res: Response) => {
//     try {
//         const gstRepo = getRepository(GstRegistrations);
//         const registration = await gstRepo.findOne(req.params.id);
        
//         if (!registration) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'GST registration not found'
//             });
//         }
        
//         res.status(200).json({
//             success: true,
//             data: registration
//         });
        
//     } catch (error) {
//         console.error('Error in getGstRegistration:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch GST registration',
//             error: error.message
//         });
//     }
// };