import { Router } from 'express';
import { chat } from '../controllers/aiChatController';
import { budgetInsight } from '../controllers/aiBudgetInsightController';

const router = Router();


router.post('/', chat);
router.post('/insight', budgetInsight);

export default router;
