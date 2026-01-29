import { Router } from 'express';
import {getBalance} from '../controllers/BalanceControler'



const router = Router();

router.get('/',getBalance)

export default router;