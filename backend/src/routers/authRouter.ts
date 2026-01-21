import { Router } from 'express';
import { register, login, logout,resetPassword,forgetpassword,checkCode } from '../controllers/authController.js';
import { validation } from '../Middleware/validateResource.js';
import { loginSchema,registerSchema,resetPasswordSchema,forgetPasswordSchema,checkCodeSchema } from '../schemas/authSchema.js';
import {authenticateResetpasswordToken} from '../Middleware/authMiddleware.js'
import { 
    limitEmailSending,
    limitGlobalTraffic,
    limitLoginAttempts
 } from '../Middleware/ratelimiterMiddleware.js';

const router = Router();

router.post('/register',
    limitGlobalTraffic,
    validation(registerSchema), register);
router.post('/login',
    limitGlobalTraffic,
    limitLoginAttempts,
    validation(loginSchema), login);
router.post('/logout', logout);

router.post('/reset-password',
     authenticateResetpasswordToken,
     validation(resetPasswordSchema), resetPassword);
router.post('/forgetpassword',
    limitEmailSending,
    validation(forgetPasswordSchema),forgetpassword);
router.post('/checkCode',
    limitGlobalTraffic,
    limitLoginAttempts,
    validation(checkCodeSchema),checkCode)

export default router;