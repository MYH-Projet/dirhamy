import { Router } from 'express';
import { 
    getTransaction, 
    createTransaction, 
    updateTransaction, 
    removeTransaction 
} from '../controllers/transactionControler'; // Adjust path to your controller
import { validation } from '../Middleware/validateResource';
import { 
    createTransactionSchema,
    updateTransactionSchema,
    removeTransactionSchema,
    getTransactionSchema
} from '../schemas/transactionSchema';
import {authenticateToken , AuthRequest} from '../Middleware/authMiddleware'


const router = Router();

// ==========================================
// 1. READ: Get Transactions for a User
// ==========================================
// Route: GET /api/transactions/user/:id?cursor=123
// Params: :id = User ID
router.get('/user',authenticateToken,validation(getTransactionSchema), getTransaction);


// ==========================================
// 2. CREATE: Make a new transaction
// ==========================================
// Route: POST /api/transactions
// Body: { montant, type, description, compteId, ... }
router.post('/',authenticateToken,(req,res,next)=>{
    console.log("what the f********");
    next(); 
},validation(createTransactionSchema),(req,res,next)=>{
    console.log("what i pass the validate");
    next(); 
}, createTransaction);


// ==========================================
// 3. UPDATE: Edit an existing transaction
// ==========================================
// Route: PUT /api/transactions/:id
// Params: :id = Transaction ID
router.put('/:id',authenticateToken,validation(updateTransactionSchema), updateTransaction);


// ==========================================
// 4. DELETE: Remove a transaction
// ==========================================
// Route: DELETE /api/transactions/:id
// Params: :id = Transaction ID
router.delete('/:id', authenticateToken,validation(removeTransactionSchema), removeTransaction);

export default router;