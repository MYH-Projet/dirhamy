import { Request, Response } from 'express';
import { AuthRequest, JwtPayload } from '../Middleware/authMiddleware';
import { prisma } from "../lib/prisma";
import { cache, keyGenerator } from '../utils/cache';

export const getBalance = async (req: AuthRequest, res: Response) => {
    const user = req.user as JwtPayload;
    const cacheInfo = keyGenerator(req);
    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    const userId = Number(user.id);
    const compteId = Number(req.query.compteId); 

    try {
        // 1. Verify Compte exists AND belongs to the User (Security)
        const compte = await prisma.compte.findFirst({
            where: { 
                id: compteId,
                utilisateurId: userId 
            }
        });

        if (!compte) {
            return res.status(404).json({ error: "Account not found or access denied" });
        }

        // 2. Get the most recent snapshot (Save Point)
        const lastSnapshot = await prisma.balanceSnapshot.findFirst({
            where: { compteId },
            orderBy: { date: 'desc' },
        });

        // If a snapshot exists, use its data. If not, start from the beginning of time with 0 balance.
        const lastSnapshotDate = lastSnapshot?.date || new Date(0); 
        const baseBalance = lastSnapshot?.solde || 0;

        // 3. Sum all transactions that happened AFTER the snapshot
        const transactionAggregates = await prisma.transaction.aggregate({
            where: {
                compteId,
                date: { gt: lastSnapshotDate } 
            },
            _sum: {
                montant: true
            }
        });

        const recentTransactionsSum = transactionAggregates._sum.montant || 0;

        // 4. Calculate Final Live Balance
        const finalBalance = baseBalance + recentTransactionsSum;

        const result ={
            compteId,
            snapshotDate: lastSnapshotDate,
            finalBalance
        }

        cache(cacheInfo,result)

        return res.status(200).json(result);
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error calculating balance" });
    }
}