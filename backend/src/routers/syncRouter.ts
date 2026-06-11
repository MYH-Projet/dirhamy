import { Router } from 'express';
import { syncData } from '../controllers/syncController';

const router = Router();

router.get('/', syncData);

export default router;
