import { generateInsight } from '../services/aiService';
import { Request, Response } from 'express';
import { dataAggregator } from '../services/dataAggregator';
import { AuthRequest, JwtPayload } from '../Middleware/authMiddleware';
import { prisma } from '../lib/prisma';

// Budget status type for type safety
interface BudgetStatus {
    categoryId: number;
    categoryName: string;
    startDate: Date;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
}

export const budgetInsight = async (req: AuthRequest, res: Response) => {

    const user = req.user as JwtPayload;
    const userId = Number(user.id);
    if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid User ID" });
    }

    // Get user data from the dataAggregator function
    let userData: string;
    try {
        console.log("user id : ", userId);
        userData = await dataAggregator(userId);
        console.log("user data : ", userData);
    } catch (e) {
        console.error("❌ Error aggregating user data:", e);
        return res.status(500).json({ error: "Failed to gather user data" });
    }

    // Get budget data for the user
    let budgetData: BudgetStatus[];
    try {
        budgetData = await getBudgetData(userId);
        console.log("budget data : ", budgetData);
    } catch (e) {
        console.error("❌ Error fetching budget data:", e);
        return res.status(500).json({ error: "Failed to gather budget data" });
    }

    // If no budgets, return empty response
    if (budgetData.length === 0) {
        return res.status(200).json({ reply: null, budgets: [], message: "No budgets found" });
    }

    // Getting the AI response with insights
    let reply: string;
    try {
        reply = await generateInsight(userData, budgetData);
    } catch (e) {
        console.error("❌ Gemini API error:", e);
        return res.status(500).json({ error: "AI service failed" });
    }

    // Parse AI response to extract JSON insights
    let insights = null;
    try {
        // Remove markdown code blocks if present (```json ... ```)
        const cleanedReply = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        insights = JSON.parse(cleanedReply);
    } catch (e) {
        console.error("⚠️ Could not parse AI response as JSON:", e);
        // Return raw reply if parsing fails
        insights = { raw: reply };
    }

    return res.status(200).json({
        budgets: budgetData,
        insights: insights
    });
}


/**
 * Fetches budget status data for a user (reusable function, not a route handler)
 */
export async function getBudgetData(userId: number): Promise<BudgetStatus[]> {
    // Find all categories with a defined limit
    const limitedCategories = await prisma.categorie.findMany({
        where: {
            utilisateurId: userId,
            limit: { not: null },
        },
    });

    if (limitedCategories.length === 0) {
        return [];
    }

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Process each category
    const budgetData = await Promise.all(
        limitedCategories.map(async (category) => {
            // Find the most recent BudgetSnapshot for this category
            const lastSnapshot = await prisma.budgetSnapshot.findFirst({
                where: {
                    categorieId: category.id,
                },
                orderBy: {
                    monthDate: "desc",
                },
            });

            // Determine the start date for calculation
            let startDate: Date;
            let currentLimit = category.limit || 0;

            if (lastSnapshot) {
                startDate = lastSnapshot.monthDate;
            } else {
                startDate = startOfCurrentMonth;
            }

            // Calculate real-time spend from transactions
            const aggregation = await prisma.transaction.aggregate({
                _sum: {
                    montant: true,
                },
                where: {
                    categorieId: category.id,
                    type: "DEPENSE",
                    date: {
                        gte: startDate,
                    },
                },
            });

            const totalSpent = -(aggregation._sum.montant || 0);

            return {
                categoryId: category.id,
                categoryName: category.nom,
                startDate: startDate,
                limit: currentLimit,
                spent: totalSpent,
                remaining: currentLimit - totalSpent,
                percentage: currentLimit > 0 ? (totalSpent / currentLimit) * 100 : 0,
            };
        })
    );

    return budgetData;
}