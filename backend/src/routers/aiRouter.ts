import { Router } from 'express';
import { chat } from '../controllers/aiChatController';
import { budgetInsight } from '../controllers/aiBudgetInsightController';
import {
    getConversations,
    createConversation,
    deleteConversation,
    updateConversation,
    getMessages
} from '../controllers/chatHistoryController';

const router = Router();

// AI Chat
router.post('/', chat);
router.post('/insight', budgetInsight);

// Conversation CRUD
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.delete('/conversations/:id', deleteConversation);
router.patch('/conversations/:id', updateConversation);

// Messages for a conversation
router.get('/conversations/:id/messages', getMessages);

export default router;
