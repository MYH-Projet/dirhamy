import { Router } from 'express';
import { getBudgetStatus, setCategoryLimit, removeBudgetLimit } from '../controllers/BudgetController';


const router = Router();

router.get('/status', getBudgetStatus);
router.post('/limit', setCategoryLimit); // Send { categoryId: 1, limit: 500 }
router.delete('/limit/:categoryId', removeBudgetLimit);

export default router;