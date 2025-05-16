import express from 'express';

import { createOrUpdateGstRegistration, getGstIns, getGSTR1Entries, createGSTR1Entry, getGSTR1Entry, getSuggestedGSTR1Period, getSingleRegistration, createGSTR3bEntry, getGSTR3bEntry, getGSTR3bEntries, getSuggestedGSTR3bPeriod, getGstr1PurchaseCalculations, getGstr1SalesCalculations } from "../../controllers/gst/GstRegistration";

import { authenticate, gstAuthenticate } from '@/api/middlewares/auth/Authenticate';

const router = express.Router();

router.post('/gst-registrations', authenticate, createOrUpdateGstRegistration);
router.get('/gstIns', authenticate, getGstIns);

router.get('/registrations/single', authenticate, gstAuthenticate, getSingleRegistration);
router.post('/gstr1', authenticate, gstAuthenticate, createGSTR1Entry);
router.get('/gstr1', authenticate, gstAuthenticate, getGSTR1Entry);
router.get('/gstr1/all', authenticate, gstAuthenticate, getGSTR1Entries);
router.get('/gstr1/suggestedPeriod', authenticate, gstAuthenticate, getSuggestedGSTR1Period);

router.get('/gstr1/get-purchase', authenticate, gstAuthenticate, getGstr1PurchaseCalculations);
router.get('/gstr1/get-sales', authenticate, gstAuthenticate, getGstr1SalesCalculations);

router.post('/gstr3b', authenticate, gstAuthenticate, createGSTR3bEntry);
router.get('/gstr3b', authenticate, gstAuthenticate, getGSTR3bEntry);
router.get('/gstr3b/all', authenticate, gstAuthenticate, getGSTR3bEntries);
router.get('/gstr3b/suggested-period', authenticate, gstAuthenticate, getSuggestedGSTR3bPeriod);


export default router;
