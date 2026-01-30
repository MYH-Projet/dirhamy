import { Router } from 'express';
import { getBudgetStatus, setCategoryLimit, removeBudgetLimit } from '../controllers/BudgetController';
import { cacheWithDependencies } from '../Middleware/cacheMiddleware';


const router = Router();
router.use(cacheWithDependencies([]))

router.get('/status', getBudgetStatus);
router.post('/limit', setCategoryLimit); // Send { categoryId: 1, limit: 500 }
router.delete('/limit/:categoryId', removeBudgetLimit);

export default router;