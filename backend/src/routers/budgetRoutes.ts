import { Router } from 'express';
import { getBudgetStatus, setCategoryLimit, removeBudgetLimit } from '../controllers/BudgetController';
import { authenticateToken } from '../Middleware/authMiddleware';

const router = Router();

router.get('/status', authenticateToken, getBudgetStatus);
router.post('/limit', authenticateToken, setCategoryLimit); // Send { categoryId: 1, limit: 500 }
router.delete('/limit/:categoryId', authenticateToken, removeBudgetLimit);

export default router;