import { Router } from 'express';
import { register, login, logout,resetPassword,forgetpassword,checkCode } from '../controllers/authController.js';
import { validation } from '../Middleware/validateResource.js';
import { loginSchema,registerSchema,resetPasswordSchema,forgetPasswordSchema,checkCodeSchema } from '../schemas/authSchema.js';
import {authenticateResetpasswordToken} from '../Middleware/authMiddleware.js'


const router = Router();

router.post('/register',validation(registerSchema), register);
router.post('/login',validation(loginSchema), login);
router.post('/logout', logout);

router.post('/reset-password', authenticateResetpasswordToken,validation(resetPasswordSchema), resetPassword);
router.post('/forgetpassword',validation(forgetPasswordSchema),forgetpassword);
router.post('/checkCode',validation(checkCodeSchema),checkCode)

export default router;