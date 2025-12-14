import { Router } from 'express';
import { 
    createCategory, 
    getAllCategories, 
    getCategoryById, 
    updateCategory, 
    deleteCategory 
} from '../controllers/categoryController';
// Adjust this import path to where your actual middleware is located
import { authenticateToken } from '../Middleware/authMiddleware'; 

const router = Router();

// 1. Apply Authentication Middleware
// This ensures 'req.user' is populated before any controller is hit.
router.use(authenticateToken);

// 2. Define Routes
// POST /api/categories - Create a new category
router.post('/', createCategory);

// GET /api/categories - Get all categories for the logged-in user
router.get('/', getAllCategories);

// GET /api/categories/:id - Get a specific category
router.get('/:id', getCategoryById);

// PUT /api/categories/:id - Update a category
router.put('/:id', updateCategory);

// DELETE /api/categories/:id - Delete a category
router.delete('/:id', deleteCategory);

export default router;