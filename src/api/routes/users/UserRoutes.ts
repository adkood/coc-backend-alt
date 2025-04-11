import express from 'express';

import { addGSTIN } from '../../controllers/user/UserControllers';
import { authenticate } from '@/api/middlewares/auth/Authenticate';

const Router = express.Router();

Router.post('/add-gstIn', authenticate, addGSTIN);

export default Router;

