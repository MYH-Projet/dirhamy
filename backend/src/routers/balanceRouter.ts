import { Router } from 'express';
import {getBalance} from '../controllers/BalanceControler';
import { cacheWithDependencies } from '../Middleware/cacheMiddleware';




const router = Router();

router.get('/',cacheWithDependencies([]),getBalance)

export default router;