import { Router } from 'express';
import { 
    getTransaction, 
    createTransaction, 
    updateTransaction, 
    removeTransaction 
} from '../controllers/transactionControler'; // Adjust path to your controller

import {authenticateToken , AuthRequest} from '../Middleware/authMiddleware'


const router = Router();

// ==========================================
// 1. READ: Get Transactions for a User
// ==========================================
// Route: GET /api/transactions/user/:id?cursor=123
// Params: :id = User ID
router.get('/user',authenticateToken, getTransaction);


// ==========================================
// 2. CREATE: Make a new transaction
// ==========================================
// Route: POST /api/transactions
// Body: { montant, type, description, compteId, ... }
router.post('/',authenticateToken, createTransaction);


// ==========================================
// 3. UPDATE: Edit an existing transaction
// ==========================================
// Route: PUT /api/transactions/:id
// Params: :id = Transaction ID
router.put('/:id',authenticateToken, updateTransaction);


// ==========================================
// 4. DELETE: Remove a transaction
// ==========================================
// Route: DELETE /api/transactions/:id
// Params: :id = Transaction ID
router.delete('/:id', removeTransaction);

export default router;