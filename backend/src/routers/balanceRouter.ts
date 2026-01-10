import { Router } from 'express';
import {getBalance} from '../controllers/BalanceControler'
import {authenticateToken , AuthRequest} from '../Middleware/authMiddleware'


const router = Router();

router.get('/',authenticateToken,getBalance)

export default router;