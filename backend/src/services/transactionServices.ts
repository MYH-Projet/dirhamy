import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { TypeTransaction } from "../../generated/prisma/enums";
import { Transaction } from "../../generated/prisma/browser";
import { p } from "vitest/dist/chunks/reporters.d.CWXNI2jG";

interface CreateTransactionData {
  montant: number;
  type: TypeTransaction;
  description: string;
  date: Date;
  compteId: number;
  categorieId: number;
  idDestination?: number | null;
}
interface UpdateTransactionData {
  montant: number;
  description: string;
  date: Date;
  categorieId: number;
}

export const checkAccount = async (compteId: number,categorieId:number, userId: number) => {
    console.log("i m about giting checked")
  const isHasAccount = await prisma.compte.findFirst({
    where: {
      id: compteId,
      utilisateurId: userId
    }
  });

  const isHasCategory = await prisma.categorie.findFirst({
    where:{
        utilisateurId:userId,
        id:categorieId
    }
  })

  if (!isHasAccount) {
    throw new AppError("Forbidden: You do not own this source account", 403);
  }
  if (!isHasCategory) {
    throw new AppError("Forbidden: You do not own this category", 403);
  }
};

export const createTransaction = async (data: CreateTransactionData) => {
    console.log("i reach to the service create transaction")
  const { montant, type, description, date, compteId, categorieId, idDestination } = data;

  // --- BRANCH 1: TRANSFER (Double Entry) ---
  if (type === TypeTransaction.TRANSFER) {
    

    return await prisma.$transaction(async (tx) => {
        const transfers = await tx.transfer.create({
            data: {
                transactions: {
                    create: [
                        // Transaction 1: Debit Account A (Negative amount)
                        {
                            montant: -montant,
                            compteId: compteId,
                            description: description,
                            type: type, // or however you handle types
                            date: date,
                            categorieId: categorieId
                        },
                        // Transaction 2: Credit Account B (Positive amount)
                        {
                            montant: montant,
                            compteId: idDestination!,
                            description: description,
                            type: type,
                            date: date,
                            categorieId: categorieId
                        }
                    ]
                }
            },
            include: {
                transactions: true // Return the created transactions to the frontend
            }
        });

      // 3. Update Snapshots for Sender (Decrease Balance)
      await tx.balanceSnapshot.updateMany({
        where: {
          compteId: compteId,
          date: { gte: date } // Update all future snapshots to reflect history change
        },
        data: {
          solde: { decrement: montant } // Cleaner than increment: -montant
        }
      });

      // 4. Update Snapshots for Receiver (Increase Balance)
      await tx.balanceSnapshot.updateMany({
        where: {
          compteId: idDestination!,
          date: { gte: date }
        },
        data: {
          solde: { increment: montant }
        }
      });

      return transfers;
    });
  }

  // --- BRANCH 2: EXPENSE & INCOME (Single Entry) ---
  
  let finalAmount = montant;
  if (type === TypeTransaction.DEPENSE) {
    finalAmount = -finalAmount;
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Create Transaction
    const transaction = await tx.transaction.create({
      data: {
        montant: finalAmount,
        type: type,
        description: description,
        date: date,
        compteId: compteId,
        categorieId: categorieId,
        transferId: null
      }
    });

    // 2. Update Snapshots
    await tx.balanceSnapshot.updateMany({
      where: {
        compteId: compteId,
        date: { gte: date }
      },
      data: {
        solde: { increment: finalAmount } // Works for both positive (income) and negative (expense)
      }
    });

    return transaction; 
  });
};

export const checkExistAndOwnershipTransaction = async(
    transactionId: number, 
    userId: number
)=>{
    const existingTransaction = await prisma.transaction.findFirst({
        where: { 
            id: transactionId,
            compte: { utilisateurId: userId } // Security check
        }
    });

    if (!existingTransaction) {
        throw new AppError("Transaction not found or access denied", 404);
    }
    return existingTransaction;
}

export const checkExistAndOwnershipTransactionCategory = async(
    transactionId: number, 
    userId: number,
    categorieId:number
)=>{
    const existingTransaction = await prisma.transaction.findFirst({
        where: { 
            id: transactionId,
            compte: { utilisateurId: userId } // Security check
        }
    });

    if (!existingTransaction) {
        throw new AppError("Transaction not found or access denied", 404);
    }

    const iscategorie = await prisma.categorie.findUnique({
        where:{
            id:categorieId,
            utilisateurId:userId
        }
    })

    if(!iscategorie){
        throw new AppError("cagegorie not found or access denied", 404);
    }

    return existingTransaction;
}

export const updateTransaction = async (
    transactionId: number,
    existingTransaction: Transaction, 
    data: UpdateTransactionData
) => {
    const { montant, description, date, categorieId } = data;
    
    // Check if the date has physically changed (Time Travel)
    const dateChanged = new Date(date).getTime() !== new Date(existingTransaction.date).getTime();

    // ==========================================================
    // SCENARIO A: TRANSFER (Update Both Sides)
    // ==========================================================
    if (existingTransaction.type === TypeTransaction.TRANSFER) {
        
        // 1. Find the Parent and the Partner Transaction
        const parentTransfer = await prisma.transfer.findUnique({
            where: { id: existingTransaction.transferId! },
            include: { transactions: true }
        });

        if (!parentTransfer || parentTransfer.transactions.length < 2) {
            throw new Error(`Critical: Broken transfer link for ID ${transactionId}`);
        }

        
        const partnerTransaction = parentTransfer.transactions.find(
            (t) => t.id !== existingTransaction.id
        );

        if (!partnerTransaction) throw new Error("Partner transaction not found");

        // 2. Calculate New Amounts
        const isSenderSide = existingTransaction.montant < 0;
        const cleanAmount = montant

        const newAmountMain = isSenderSide ? -cleanAmount : cleanAmount;
        const newAmountPartner = isSenderSide ? cleanAmount : -cleanAmount;

        return await prisma.$transaction(async (tx) => {
            // Update Records
            const updatedMain = await tx.transaction.update({
                where: { id: transactionId },
                data: { description, categorieId, date, montant: newAmountMain }
            });

            await tx.transaction.update({
                where: { id: partnerTransaction.id },
                data: { description, categorieId, date, montant: newAmountPartner }
            });

            // 3. Update Snapshots
            if (dateChanged) {
                await tx.balanceSnapshot.updateMany({
                    where: { compteId: existingTransaction.compteId, date: { gte: existingTransaction.date } },
                    data: { solde: { decrement: existingTransaction.montant } }
                });
                // Add New (Main)
                await tx.balanceSnapshot.updateMany({
                    where: { compteId: existingTransaction.compteId, date: { gte: date } },
                    data: { solde: { increment: newAmountMain } }
                });

                // Remove Old (Partner)
                await tx.balanceSnapshot.updateMany({
                    where: { compteId: partnerTransaction.compteId, date: { gte: partnerTransaction.date } },
                    data: { solde: { decrement: partnerTransaction.montant } }
                });
                // Add New (Partner)
                await tx.balanceSnapshot.updateMany({
                    where: { compteId: partnerTransaction.compteId, date: { gte: date } },
                    data: { solde: { increment: newAmountPartner } }
                });

            } else {
                const diffMain = newAmountMain - existingTransaction.montant;
                const diffPartner = newAmountPartner - partnerTransaction.montant;

                if (diffMain !== 0) {
                    await tx.balanceSnapshot.updateMany({
                        where: { compteId: existingTransaction.compteId, date: { gte: existingTransaction.date } },
                        data: { solde: { increment: diffMain } }
                    });
                }
                if (diffPartner !== 0) {
                    await tx.balanceSnapshot.updateMany({
                        where: { compteId: partnerTransaction.compteId, date: { gte: partnerTransaction.date } },
                        data: { solde: { increment: diffPartner } }
                    });
                }
            }

            return updatedMain;
        });
    }

    // ==========================================================
    // SCENARIO B: SIMPLE TRANSACTION (Expense/Revenue)
    // ==========================================================
    
    let finalAmount = montant;
    if (existingTransaction.type === TypeTransaction.DEPENSE) {
        finalAmount = -finalAmount;
    }

    return await prisma.$transaction(async (tx) => {
        const updatedTransaction = await tx.transaction.update({
            where: { id: transactionId },
            data: { description, categorieId, date, montant: finalAmount }
        });

        if (dateChanged) {
            // A. Remove the OLD amount from the OLD date history
            await tx.balanceSnapshot.updateMany({
                where: {
                    compteId: existingTransaction.compteId,
                    date: { gte: existingTransaction.date }
                },
                data: { solde: { decrement: existingTransaction.montant } }
            });

            // B. Add the NEW amount to the NEW date history
            await tx.balanceSnapshot.updateMany({
                where: {
                    compteId: existingTransaction.compteId,
                    date: { gte: date }
                },
                data: { solde: { increment: finalAmount } }
            });
        } else {
            // C. Simple Diff (Your preferred logic)
            const diff = finalAmount - existingTransaction.montant;
            if (diff !== 0) {
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: existingTransaction.compteId,
                        date: { gte: existingTransaction.date }
                    },
                    data: { solde: { increment: diff } }
                });
            }
        }

        return updatedTransaction;
    });
};

export const deleteTransactionService = async (
    transactionId: number,
    transactionToDelete: Transaction // Ensure this type is imported
) => {
    // ==========================================================
    // SCENARIO A: TRANSFER (Delete the whole group)
    // ==========================================================
    if (transactionToDelete.type === TypeTransaction.TRANSFER) {
        
        // 1. Find the Parent Transfer and ALL related transactions
        const parentTransfer = await prisma.transfer.findUnique({
            where: { id: transactionToDelete.transferId! },
            include: { transactions: true }
        });

        if (!parentTransfer || parentTransfer.transactions.length === 0) {
            throw new Error("Critical Data Error: Transfer parent or transactions missing");
        }

        return await prisma.$transaction(async (tx) => {
            // 2. Iterate over BOTH transactions to revert their impact
            for (const t of parentTransfer.transactions) {
                // Revert logic: If amount was -100, we add +100. If +100, we add -100.
                const diff = -t.montant; 

                // Update history for this specific account
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: t.compteId,
                        date: { gte: t.date }
                    },
                    data: { solde: { increment: diff } }
                });
            }

            // 3. Delete the Transaction entries first (to be safe against FK constraints)
            await tx.transaction.deleteMany({
                where: { transferId: parentTransfer.id }
            });

            // 4. Delete the Parent Transfer record
            await tx.transfer.delete({
                where: { id: parentTransfer.id }
            });

            return { message: "Transfer event completely removed and balances synchronized" };
        });
    }

    // ==========================================================
    // SCENARIO B: SIMPLE TRANSACTION (Expense/Revenue)
    // ==========================================================
    
    // Logic: Just reverse the single amount
    const diff = -transactionToDelete.montant;

    return await prisma.$transaction(async (tx) => {
        // 1. Delete the single Transaction
        await tx.transaction.delete({
            where: { id: transactionId }
        });

        // 2. Correct Account History
        await tx.balanceSnapshot.updateMany({
            where: {
                compteId: transactionToDelete.compteId,
                date: { gte: transactionToDelete.date }
            },
            data: { solde: { increment: diff } }
        });

        return { message: "Transaction deleted and balance synchronized" };
    });
};