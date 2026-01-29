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
    const compteIdQuery = req.query.compteId;

    try {
        if (compteIdQuery) {
            const compteId = Number(compteIdQuery);
            if (isNaN(compteId)) {
                return res.status(400).json({ error: "Invalid account ID" });
            }

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
        } else {
            // Calculate TOTAL balance across all accounts
            const comptes = await prisma.compte.findMany({
                where: { utilisateurId: userId }
            });

            let totalBalance = 0;

            for (const compte of comptes) {
                const lastSnapshot = await prisma.balanceSnapshot.findFirst({
                    where: { compteId: compte.id },
                    orderBy: { date: 'desc' },
                });

                const base = lastSnapshot?.solde || 0;
                const date = lastSnapshot?.date || new Date(0);

                const txSum = await prisma.transaction.aggregate({
                    where: { compteId: compte.id, date: { gt: date } },
                    _sum: { montant: true }
                });

                totalBalance += (base + (txSum._sum.montant || 0));
            }

            return res.status(200).json({ totalBalance });
        }

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error calculating balance", details: String(error) });
    }
}