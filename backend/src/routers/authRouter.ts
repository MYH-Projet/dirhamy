import { Router } from 'express';
import { register, login, logout } from '../controllers/authController.js';
import { validation } from '../Middleware/validateResource.js';
import { loginSchema,registerSchema } from '../schemas/authSchema.js';

const router = Router();

router.post('/register',validation(registerSchema), register);
router.post('/login',validation(loginSchema), login);
router.post('/logout', logout);

export default router;