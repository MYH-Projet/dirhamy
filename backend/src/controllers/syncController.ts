import { Response } from "express";
import { AuthRequest, JwtPayload } from "../Middleware/authMiddleware";
import { prisma } from "../lib/prisma";

export const syncData = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = Number(user.id);
    const sinceParam = req.query.since as string;

    if (!sinceParam) {
      return res.status(400).json({ error: "Missing 'since' query parameter (timestamp or ISO string)" });
    }

    // Support both numeric timestamp (milliseconds) and ISO string
    const sinceDate = !isNaN(Number(sinceParam)) 
        ? new Date(Number(sinceParam)) 
        : new Date(sinceParam);

    if (isNaN(sinceDate.getTime())) {
        return res.status(400).json({ error: "Invalid 'since' format" });
    }

    // 1. Get Categories updated or deleted since this date
    const categories = await prisma.categorie.findMany({
      where: {
        utilisateurId: userId,
        updatedAt: { gt: sinceDate }
      }
    });

    // 2. Get Accounts (Comptes) updated since this date
    const comptes = await prisma.compte.findMany({
      where: {
        utilisateurId: userId,
        updatedAt: { gt: sinceDate }
      }
    });

    // 3. Get Transactions updated or deleted since this date
    const transactions = await prisma.transaction.findMany({
      where: {
        compte: { utilisateurId: userId },
        updatedAt: { gt: sinceDate },
        OR: [
          { type: 'REVENU' },
          { type: 'DEPENSE' },
          { type: 'TRANSFER', montant: { lt: 0 } } // Send only the sender side of transfers!
        ]
      }
    });

    // 4. Get Transfers updated or deleted since this date
    const transfers = await prisma.transfer.findMany({
      where: {
        transactions: {
            some: {
                compte: { utilisateurId: userId }
            }
        },
        updatedAt: { gt: sinceDate }
      },
      include: {
          transactions: true // Return the nested transactions for the Flutter app to process
      }
    });

    res.status(200).json({
      categories,
      comptes,
      transactions,
      transfers,
      // Provide the exact server time so the phone can use it for its next sync
      serverTimestamp: new Date().getTime(), 
    });

  } catch (error) {
    console.error("Sync Error:", error);
    res.status(500).json({ error: "Failed to process sync request" });
  }
};
