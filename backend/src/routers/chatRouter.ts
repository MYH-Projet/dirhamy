import { Router } from 'express';
import { chat } from '../controllers/chatController';
import { authenticateToken } from '../Middleware/authMiddleware';


const router = Router();


router.post('/',authenticateToken, chat);

export default router;
