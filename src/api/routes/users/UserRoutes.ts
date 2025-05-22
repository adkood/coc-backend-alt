import express from 'express';

import { addGSTIN } from '../../controllers/user/UserControllers';
import { authenticate } from '@/api/middlewares/auth/Authenticate';
import { createEnquiry, createLetter } from "../../controllers/extra/Extra";

const Router = express.Router();

Router.post('/add-gstIn', authenticate, addGSTIN);


// extra
Router.post('/enquiry', authenticate, createEnquiry);
Router.post('/news-letter', authenticate, createLetter);



export default Router;

