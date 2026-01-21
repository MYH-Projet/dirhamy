import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../Middleware/authMiddleware';

export const getBudgetStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // 1. Find all "Limited Categories" (Categories with a defined limit)
        const limitedCategories = await prisma.categorie.findMany({
            where: {
                utilisateurId: userId,
                limit: { not: null } // Only get categories that have a budget limit
            }
        });

        if (limitedCategories.length === 0) {
            return res.status(200).json({ data: [] });
        }

        const now = new Date();
        const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 2. Process each category individually
        const budgetData = await Promise.all(
            limitedCategories.map(async (category) => {
                
                // A. Find the most recent BudgetSnapshot for this specific category
                const lastSnapshot = await prisma.budgetSnapshot.findFirst({
                    where: {
                        categorieId: category.id
                    },
                    orderBy: {
                        monthDate: 'desc' // Find the latest one
                    }
                });

                // B. Determine the Start Date for calculation
                // Logic: If snapshot exists, start from its date. If not, start from 1st of current month.
                let startDate: Date;
                let currentLimit = category.limit || 0;

                if (lastSnapshot) {
                    startDate = lastSnapshot.monthDate;
                    // Optional: Use the limit from the snapshot if you want historical accuracy, 
                    // but usually, the user wants the current category limit.
                    // currentLimit = lastSnapshot.limit; 
                } else {
                    startDate = startOfCurrentMonth;
                }

                // C. Calculate the Real-Time Spend from Transactions
                // We sum all 'DEPENSE' transactions for this category since the startDate
                const aggregation = await prisma.transaction.aggregate({
                    _sum: {
                        montant: true
                    },
                    where: {
                        categorieId: category.id,
                        type: 'DEPENSE', // Enum from your schema
                        date: {
                            gte: startDate
                        }
                    }
                });

                const totalSpent = -(aggregation._sum.montant || 0);

                // D. Return the calculated object
                return {
                    categoryId: category.id,
                    categoryName: category.nom, // Schema uses 'nom'
                    startDate: startDate,
                    limit: currentLimit,
                    spent: totalSpent,
                    remaining: currentLimit - totalSpent,
                    percentage: currentLimit > 0 ? (totalSpent / currentLimit) * 100 : 0
                };
            })
        );

        return res.status(200).json(budgetData);

    } catch (error) {
        console.error('Error calculating budget status:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const setCategoryLimit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { categoryId, limit } = req.body;

        if (!userId) return res.status(401).json({ error: 'User not authenticated' });
        if (!categoryId || limit === undefined) {
            return res.status(400).json({ error: 'Category ID and limit are required' });
        }

        // Verify category belongs to user
        const category = await prisma.categorie.findUnique({
            where: { id: Number(categoryId) }
        });

        if (!category || category.utilisateurId !== userId) {
            return res.status(404).json({ error: 'Category not found or access denied' });
        }

        // Update the limit
        const updatedCategory = await prisma.categorie.update({
            where: { id: Number(categoryId) },
            data: { limit: parseFloat(limit) }
        });

        return res.status(200).json({ message: 'Budget limit updated', category: updatedCategory });

    } catch (error) {
        console.error('Error setting budget limit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

export const removeBudgetLimit = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { categoryId } = req.params;

        if (!userId) return res.status(401).json({ error: 'User not authenticated' });

        const category = await prisma.categorie.findUnique({
            where: { id: Number(categoryId) }
        });

        if (!category || category.utilisateurId !== userId) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Set limit to null to stop tracking
        await prisma.categorie.update({
            where: { id: Number(categoryId) },
            data: { limit: null }
        });

        return res.status(200).json({ message: 'Budget limit removed' });

    } catch (error) {
        console.error('Error removing budget limit:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};