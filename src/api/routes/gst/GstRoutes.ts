import express from 'express';

import { createOrUpdateGstRegistration, getGstIns, getGSTR1Entries, createGSTR1Entry, getGSTR1Entry, getSuggestedGSTR1Period,getSingleRegistration } from "../../controllers/gst/GstRegistration";

import { authenticate, gstAuthenticate } from '@/api/middlewares/auth/Authenticate';

const router = express.Router();

router.post('/gst-registrations', authenticate, createOrUpdateGstRegistration);
router.get('/gstIns', authenticate, getGstIns);

router.get('/registrations/single', authenticate, gstAuthenticate, getSingleRegistration);
router.post('/gstr1', authenticate, gstAuthenticate, createGSTR1Entry);
router.get('/gstr1', authenticate, gstAuthenticate, getGSTR1Entry);
router.get('/gstr1/all', authenticate, gstAuthenticate, getGSTR1Entries);
router.get('/gstr1/suggestedPeriod', authenticate, gstAuthenticate, getSuggestedGSTR1Period);


export default router;
