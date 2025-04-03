import express from 'express';

import { addGSTIN, updateTRN } from '../../controllers/user/UserControllers';
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/update-trn', authenticate, updateTRN);
Router.post('/add-gstIn', authenticate, addGSTIN);

export default Router;

