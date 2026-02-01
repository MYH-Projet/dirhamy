import { Router } from 'express';
import { chat } from '../controllers/aiChatController';
import { budgetInsight } from '../controllers/aiBudgetInsightController';
import { getHistory, clearHistory } from '../controllers/chatHistoryController';

const router = Router();

router.post('/', chat);
router.post('/insight', budgetInsight);

// Chat history routes
router.get('/history', getHistory);
router.delete('/history', clearHistory);

export default router;

