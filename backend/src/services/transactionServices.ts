import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { TypeTransaction } from "../../generated/prisma/enums";
import { Transaction } from "../../generated/prisma/browser";

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

export const checkAccount = async (compteId: number, userId: number) => {
    console.log("i m about giting checked")
  const isHasAccount = await prisma.compte.findFirst({
    where: {
      id: compteId,
      utilisateurId: userId
    }
  });

  if (!isHasAccount) {
    throw new AppError("Forbidden: You do not own this source account", 403);
  }
};

export const createTransaction = async (data: CreateTransactionData) => {
    console.log("i reach to the service create transaction")
  const { montant, type, description, date, compteId, categorieId, idDestination } = data;

  // --- BRANCH 1: TRANSFER (Double Entry) ---
  if (type === TypeTransaction.TRANSFER) {
    

    return await prisma.$transaction(async (tx) => {
      // 1. Sender (Money leaves -> Negative)
      const sender = await tx.transaction.create({
        data: {
          montant: -montant,
          type: TypeTransaction.TRANSFER,
          description: description || `Virement vers compte ${idDestination}`,
          date: date,
          compteId: compteId,
          categorieId: categorieId,
          idDestination: idDestination
        }
      });

      // 2. Receiver (Money arrives -> Positive)
      const receiver = await tx.transaction.create({
        data: {
          montant: montant,
          type: TypeTransaction.TRANSFER,
          description: description || `Virement reçu du compte ${compteId}`,
          date: date,
          compteId: idDestination!,
          categorieId: categorieId,
          idDestination: compteId
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

      return { sender, receiver };
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
        idDestination: null
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
    existingTransaction:Transaction, 
    data: UpdateTransactionData
) => {
    const { montant, description, date, categorieId } = data;
    

    // --- SCENARIO A: TRANSFER (Update Both Sides) ---
    if (existingTransaction.type === TypeTransaction.TRANSFER) {
        
        // Find the "Partner" transaction (the other side of the transfer)
        const partnerTransaction = await prisma.transaction.findFirst({
            where: {
                type: TypeTransaction.TRANSFER,
                compteId: existingTransaction.idDestination!, // The other account
                idDestination: existingTransaction.compteId, // Points back to us
                // Logic: Partner amount should be opposite of ours approximately
                // We use ID check mostly, but if you have concurrent transfers, this might need strictness
            }
        });

        if (!partnerTransaction) {
            throw new AppError(`Critical: Partner transaction missing for transfer ${transactionId}`, 500);
        }

        // Determine who is sender (negative) and receiver (positive)
        const isSenderSide = existingTransaction.montant < 0;
        const newAmountForMain = isSenderSide ? -montant : montant;
        const newAmountForPartner = isSenderSide ? montant : -montant;

        // Calculate the "Diff" to update snapshots
        // Example: Old = -100, New = -120. Diff = -20. (Balance goes down by 20 more)
        const diffMain = newAmountForMain - Number(existingTransaction.montant);
        const diffPartner = newAmountForPartner - Number(partnerTransaction.montant);

        return await prisma.$transaction(async (tx) => {
            // 1. Update Main
            const updatedMain = await tx.transaction.update({
                where: { id: transactionId },
                data: { description, categorieId, date, montant: newAmountForMain }
            });

            // 2. Update Partner
            const updatedPartner = await tx.transaction.update({
                where: { id: partnerTransaction.id },
                data: { description, categorieId, date, montant: newAmountForPartner }
            });

            // 3. Update Snapshots for Main Account
            if (diffMain !== 0) {
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: existingTransaction.compteId,
                        date: { gte: existingTransaction.date } // Update future history
                    },
                    data: { solde: { increment: diffMain } }
                });
            }

            // 4. Update Snapshots for Partner Account
            if (diffPartner !== 0) {
                await tx.balanceSnapshot.updateMany({
                    where: {
                        compteId: partnerTransaction.compteId,
                        date: { gte: partnerTransaction.date }
                    },
                    data: { solde: { increment: diffPartner } }
                });
            }

            return { updatedMain, updatedPartner };
        });
    }

    // --- SCENARIO B: SIMPLE TRANSACTION (Expense/Revenue) ---
    // Logic: Expenses are negative, Revenue is positive
    let finalAmount = montant;
    if (existingTransaction.type === TypeTransaction.DEPENSE) {
        finalAmount = -finalAmount;
    }

    const diff = finalAmount - Number(existingTransaction.montant);

    return await prisma.$transaction(async (tx) => {
        const updatedTransaction = await tx.transaction.update({
            where: { id: transactionId },
            data: { description, categorieId, date, montant: finalAmount }
        });

        if (diff !== 0) {
            await tx.balanceSnapshot.updateMany({
                where: {
                    compteId: existingTransaction.compteId,
                    date: { gte: existingTransaction.date }
                },
                data: { solde: { increment: diff } }
            });
        }

        return updatedTransaction;
    });
};


export const deleteTransactionService = async (transactionId: number,transactionToDelete:Transaction) => {
    // --- SCENARIO A: TRANSFER (Delete Both Sides) ---
    if (transactionToDelete.type === TypeTransaction.TRANSFER) {
        
        // Find the partner transaction (the other half of the transfer)
        const partnerTransaction = await prisma.transaction.findFirst({
            where: {
                type: TypeTransaction.TRANSFER,
                compteId: transactionToDelete.idDestination!, 
                idDestination: transactionToDelete.compteId,  
                montant: -transactionToDelete.montant         
            }
        });

        if (!partnerTransaction) {
            // This is a data integrity issue, but we treat it as a server error
            throw new AppError("Critical Data Error: Partner transaction missing", 500);
        }

        // Calculate "Reverse" amounts to fix history
        // e.g. If you sent -100, removing it adds +100 back to history
        const diffMain = -Number(transactionToDelete.montant);
        const diffPartner = -Number(partnerTransaction.montant);

        await prisma.$transaction(async (tx) => {
            // 1. Delete Both Transactions
            await tx.transaction.delete({ where: { id: transactionId } });
            await tx.transaction.delete({ where: { id: partnerTransaction.id } });

            // 2. Correct Main Account History
            await tx.balanceSnapshot.updateMany({
                where: {
                    compteId: transactionToDelete.compteId,
                    date: { gte: transactionToDelete.date }
                },
                data: { solde: { increment: diffMain } }
            });

            // 3. Correct Partner Account History
            await tx.balanceSnapshot.updateMany({
                where: {
                    compteId: partnerTransaction.compteId,
                    date: { gte: partnerTransaction.date }
                },
                data: { solde: { increment: diffPartner } }
            });
        });

        return { message: "Transfer deleted and balances synchronized" };
    }

    // --- SCENARIO B: SIMPLE TRANSACTION (Delete Single) ---
    
    const diff = -Number(transactionToDelete.montant);

    await prisma.$transaction(async (tx) => {
        // 1. Delete Transaction
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
    });

    return { message: "Transaction deleted and balance synchronized" };
};

