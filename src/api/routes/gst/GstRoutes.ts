import express from 'express';

import { createOrUpdateGstRegistration, getGstIns } from "../../controllers/gst/GstRegistration";
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const router = express.Router();

router.post('/gst-registrations', authenticate, createOrUpdateGstRegistration);
router.get('/gstIns', authenticate, getGstIns);


export default router;
