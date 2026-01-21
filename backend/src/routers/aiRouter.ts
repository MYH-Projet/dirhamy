import { Router } from 'express';
import { chat } from '../controllers/aiChatController';
import { budgetInsight } from '../controllers/aiBudgetInsightController';
import { authenticateToken } from '../Middleware/authMiddleware';


const router = Router();


router.post('/',authenticateToken, chat);
router.post('/budget/insight',authenticateToken, budgetInsight);

export default router;
