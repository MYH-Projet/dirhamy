import { Request,Response } from 'express';
import {AuthRequest,JwtPayload} from '../Middleware/authMiddleware'
import { prisma } from "../lib/prisma";
import { TypeTransaction } from '../../generated/prisma/enums';


export const getTransaction = async (req: AuthRequest, res: Response) => {
    // 1. Parse User ID
    const user = req.user as JwtPayload; 
    const userId = Number(user.id);

    // 2. Parse Cursor (from query param ?cursor=123)
    const cursorParam = req.query.cursor as string | undefined;
    const cursorId = cursorParam ? Number(cursorParam) : undefined;
    
    // Config: How many items to load per request
    const LIMIT = 10;

    // Safety Check
    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid User ID" });
    }

    try {
        // 3. Fetch Data
        const transactions = await prisma.transaction.findMany({
            where: {
                // Filter: Transactions where the account belongs to this user
                compte: {
                    utilisateurId: userId
                }
            },
            take: LIMIT,
            // Logic: Skip the cursor itself if provided
            skip: cursorId ? 1 : 0,
            cursor: cursorId ? { id: cursorId } : undefined,
            
            // Critical: Stable sorting (Date first, ID as tie-breaker)
            orderBy: [
                { date: 'desc' }
            ],

            // Include useful UI data
            include: {
                compte: {
                    select: { id: true, nom: true, type: true }
                },
                categorie: {
                    select: { id: true, nom: true }
                }
            }
        });

        // 4. Calculate Next Cursor
        let nextCursor: number | null = null;
        if (transactions.length === LIMIT) {
            // The ID of the last item becomes the cursor for the next page
            nextCursor = transactions[transactions.length - 1].id;
        }

        // 5. Send Response
        return res.status(200).json({
            data: transactions,
            meta: {
                nextCursor: nextCursor,
                hasMore: nextCursor !== null
            }
        });

    } catch (e) {
        console.error("❌ Error fetching transactions:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

export const createTransaction = async (req: AuthRequest, res: Response) => {
    const user = req.user as JwtPayload; 
    const userId = Number(user.id);
    // 2. Cast req.body to our interface so TypeScript knows the fields exist
    const { 
        montant, 
        type, 
        description, 
        compteId, 
        categorieId, 
        idDestination 
    } = req.body ;

    try {

        const isHasAccount = await prisma.compte.findFirst({
            where: {
                id: Number(compteId),
                utilisateurId: userId
            }
        });

        if (!isHasAccount) {
            return res.status(403).json({ 
                error: "Forbidden: You do not own this source account" 
            });
        }
        // --- LOGIC FOR TRANSFERS (Double Entry) ---
        if (type === TypeTransaction.TRANSFER) {
            // Even with validation, we check logic: Transfers need a destination
            if (!idDestination) {
                return res.status(400).json({ error: "idDestination is required for transfers" });
            }

            // We use a transaction to create BOTH sides of the transfer atomically
            const result = await prisma.$transaction(async (tx) => {
                const absAmount = Math.abs(montant);

                // Sender: Balance goes DOWN (Negative)
                const sender = await tx.transaction.create({
                    data: {
                        montant: -absAmount,
                        type: TypeTransaction.TRANSFER,
                        description: description || `Virement vers compte ${idDestination}`,
                        compteId: compteId,        // The account losing money
                        categorieId: categorieId,
                        idDestination: idDestination // Reference to the other account
                    }
                });

                // Receiver: Balance goes UP (Positive)
                const receiver = await tx.transaction.create({
                    data: {
                        montant: absAmount,
                        type: TypeTransaction.TRANSFER,
                        description: description || `Virement reçu du compte ${compteId}`,
                        compteId: idDestination,   // The account gaining money
                        categorieId: categorieId,
                        idDestination: compteId    // Reference to the source account
                    }
                });

                return { sender, receiver };
            });

            return res.status(201).json(result);
        }

        // --- LOGIC FOR EXPENSES & INCOME (Single Entry) ---
        
        // Auto-correct sign: Expenses are always negative, Income always positive
        let finalAmount = Math.abs(montant);
        if (type === TypeTransaction.DEPENSE) {
            finalAmount = -finalAmount;
        }

        const transaction = await prisma.transaction.create({
            data: {
                montant: finalAmount,
                type: type,
                description: description,
                compteId: compteId,
                categorieId: categorieId,
                idDestination: null // No destination for simple expenses
            }
        });

        return res.status(201).json(transaction);

    } catch (error) {
        console.error("Create Transaction Error:", error);
        return res.status(500).json({ error: "Could not process transaction" });
    }
}

export const removeTransaction = async (req: AuthRequest, res: Response) => {
    const transactionId = Number(req.params.id);
    const user =req.user as JwtPayload;
    const userId = Number(user.id) ;

    try {
        // 1. Fetch the transaction first to know its Type and Details
        const transactionToDelete = await prisma.transaction.findFirst({
            where: { 
                id: transactionId,
                compte: { utilisateurId: userId }
            }
        });

        if (!transactionToDelete) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // --- SCENARIO A: TRANSFER (Delete Both Sides + Update Both Snapshots) ---
        if (transactionToDelete.type === TypeTransaction.TRANSFER) {
            const partnerTransaction = await prisma.transaction.findFirst({
                where: {
                    type: TypeTransaction.TRANSFER,
                    compteId: transactionToDelete.idDestination!, 
                    idDestination: transactionToDelete.compteId,  
                    montant: -transactionToDelete.montant         
                }
            });

            if (!partnerTransaction) {
                throw new Error("Critical Data Error: Partner transaction missing for transfer ID " + transactionId);
            }

            // Calculate the "Reverse" amount to fix the balance history
            // If main was -100 (sending money), removing it means adding +100 back to history.
            const diffMain = -Number(transactionToDelete.montant);
            const diffPartner = -Number(partnerTransaction.montant);

            await prisma.$transaction(async (tx) => {
                // 1. Delete Main
                await tx.transaction.delete({ where: { id: transactionId } });
                
                // 2. Delete Partner
                await tx.transaction.delete({ where: { id: partnerTransaction.id } });

                // 3. Update Main Account Snapshots
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: transactionToDelete.compteId,
                        date: { gte: transactionToDelete.date } // All snapshots AFTER this transaction
                    },
                    data: {
                        solde: { increment: diffMain }
                    }
                });

                // 4. Update Partner Account Snapshots
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: partnerTransaction.compteId,
                        date: { gte: partnerTransaction.date }
                    },
                    data: {
                        solde: { increment: diffPartner }
                    }
                });
            });

            return res.status(200).json({ message: "Transfer deleted and balances synchronized" });
        }

        // --- SCENARIO B: SIMPLE TRANSACTION (Delete Single + Update Snapshot) ---
        
        // Calculate the reverse amount
        const diff = -Number(transactionToDelete.montant);

        await prisma.$transaction(async (tx) => {
            // 1. Delete the transaction
            await tx.transaction.delete({
                where: { id: transactionId }
            });

            // 2. Update the snapshots
            await tx.balanceSnapshot.updateMany({
                where: {
                    compteId: transactionToDelete.compteId,
                    date: { gte: transactionToDelete.date }
                },
                data: {
                    solde: { increment: diff }
                }
            });
        });

        return res.status(200).json({ message: "Transaction deleted and balance synchronized" });

    } catch (error) {
        console.error("Delete Error:", error);
        return res.status(500).json({ error: "Could not delete transaction" });
    }
};


export const updateTransaction = async (req: AuthRequest, res: Response) => {
    const transactionId = Number(req.params.id);
    const user =req.user as JwtPayload;
    const userId = Number(user.id) ;
    const { montant, description, categorieId } = req.body; 

    try {
        // 1. Fetch the existing transaction to get the OLD amount
        const existingTransaction = await prisma.transaction.findFirst({
            where: { 
                id: transactionId,
                compte: { utilisateurId: userId }
            }
        });

        if (!existingTransaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        const amountValue = Number(montant);
        const absAmount = Math.abs(amountValue);

        // --- SCENARIO A: TRANSFER (Update Both Sides & Both Snapshots) ---
        if (existingTransaction.type === TypeTransaction.TRANSFER) {
            
            // Find partner
            const partnerTransaction = await prisma.transaction.findFirst({
                where: {
                    type: TypeTransaction.TRANSFER,
                    compteId: existingTransaction.idDestination!,
                    idDestination: existingTransaction.compteId,
                    montant: -existingTransaction.montant 
                }
            });

            if (!partnerTransaction) {
                throw new Error(`Critical: Partner transaction missing for transfer ${transactionId}`);
            }

            // Determine amounts
            const isSenderSide = existingTransaction.montant < 0;
            const newAmountForMain = isSenderSide ? -absAmount : absAmount;
            const newAmountForPartner = isSenderSide ? absAmount : -absAmount;

            // Calculate Differences for Snapshots
            const diffMain = newAmountForMain - Number(existingTransaction.montant);
            const diffPartner = newAmountForPartner - Number(partnerTransaction.montant);

            const result = await prisma.$transaction(async (tx) => {
                // 1. Update Main Transaction
                const updatedMain = await tx.transaction.update({
                    where: { id: transactionId },
                    data: { description, categorieId, montant: newAmountForMain }
                });

                // 2. Update Partner Transaction
                const updatedPartner = await tx.transaction.update({
                    where: { id: partnerTransaction.id },
                    data: { description, categorieId, montant: newAmountForPartner }
                });

                // 3. Update Main Account Snapshots (Add diffMain to all future snapshots)
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: existingTransaction.compteId,
                        date: { gte: existingTransaction.date } // Update all snapshots from that date onwards
                    },
                    data: {
                        solde: { increment: diffMain }
                    }
                });

                // 4. Update Partner Account Snapshots (Add diffPartner)
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: partnerTransaction.compteId,
                        date: { gte: partnerTransaction.date }
                    },
                    data: {
                        solde: { increment: diffPartner }
                    }
                });

                return {
                    sender: isSenderSide ? updatedMain : updatedPartner,
                    receiver: isSenderSide ? updatedPartner : updatedMain
                };
            });

            return res.status(200).json({ message: "Transfer updated", ...result });
        }

        // --- SCENARIO B: SIMPLE TRANSACTION ---
        let finalAmount = Math.abs(amountValue);
        if (existingTransaction.type === TypeTransaction.DEPENSE) {
            finalAmount = -finalAmount;
        }

        // Calculate Difference
        const diff = finalAmount - Number(existingTransaction.montant);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Update Transaction
            const updated = await tx.transaction.update({
                where: { id: transactionId },
                data: { montant: finalAmount, description, categorieId }
            });

            // 2. Update Snapshots
            // If `diff` is 0 (amount didn't change), this effectively does nothing, which is fine.
            if (diff !== 0) {
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: existingTransaction.compteId,
                        date: { gte: existingTransaction.date }
                    },
                    data: {
                        solde: { increment: diff }
                    }
                });
            }

            return updated;
        });

        return res.status(200).json(result);

    } catch (error) {
        console.error("Update Error:", error);
        return res.status(500).json({ error: "Could not update transaction" });
    }
};