import express from 'express';

import { createOrUpdateGstRegistration } from "../../controllers/gst/GstRegistration";
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const router = express.Router();

router.post('/gst-registartions', authenticate, createOrUpdateGstRegistration);

export default router;
