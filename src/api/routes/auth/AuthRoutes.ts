import express from 'express';
import { login, gstLogin } from '../../controllers/auth/Login';
import { logout } from '../../controllers/auth/Logout';
import { signup } from '../../controllers/auth/Signup';
import { authenticate } from '../../middlewares/auth/Authenticate';
import { sendResetEmail, resetPassword } from "@/api/controllers/auth/ResetPassword";

const Router = express.Router();

Router.post('/signup', signup);
Router.post('/login', login);
Router.post('/gst-login', authenticate, gstLogin);
Router.post('/logout', authenticate, logout);
Router.post('/reset-pass-req', sendResetEmail);
Router.post('/reset-pass', resetPassword);

export default Router;

