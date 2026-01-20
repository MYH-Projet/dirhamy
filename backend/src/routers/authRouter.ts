import { Router } from 'express';
import { register, login, logout,resetPassword,forgetpassword,checkCode } from '../controllers/authController.js';
import { validation } from '../Middleware/validateResource.js';
import { loginSchema,registerSchema } from '../schemas/authSchema.js';
import {authenticateResetpasswordToken} from '../Middleware/authMiddleware.js'


const router = Router();

router.post('/register',validation(registerSchema), register);
router.post('/login',validation(loginSchema), login);
router.post('/logout', logout);

router.post('/reset-password', authenticateResetpasswordToken, resetPassword);
router.post('/forgetpassword',forgetpassword);
router.post('/checkCode',checkCode)

export default router;