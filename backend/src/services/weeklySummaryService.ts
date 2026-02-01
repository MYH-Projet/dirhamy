import { prisma } from "../lib/prisma";
import { generateEmbedding, formatVectorForPg } from "./embeddingService";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAi.getGenerativeModel({ model: "gemma-3-27b-it" });

// Types
interface WeeklyData {
    totalSpending: number;
    totalIncome: number;
    spendingByCategory: { name: string; amount: number; limit: number | null }[];
    budgetAdherence: { category: string; spent: number; limit: number; status: string }[];
    topTransactions: { description: string; amount: number; category: string; date: Date }[];
    savingsRate: number;
}

/**
 * Aggregate all financial data for a user within a specific week
 */
export async function aggregateWeeklyData(
    userId: number,
    weekStart: Date,
    weekEnd: Date
): Promise<WeeklyData> {
    // Get all transactions for the week
    const transactions = await prisma.transaction.findMany({
        where: {
            compte: { utilisateurId: userId },
            date: { gte: weekStart, lte: weekEnd },
        },
        include: {
            categorie: true,
            compte: true,
        },
        orderBy: { montant: "desc" },
    });

    // Calculate totals
    const totalSpending = transactions
        .filter((t) => t.type === "DEPENSE")
        .reduce((sum, t) => sum + t.montant, 0);

    const totalIncome = transactions
        .filter((t) => t.type === "REVENU")
        .reduce((sum, t) => sum + t.montant, 0);

    // Spending by category
    const categoryMap = new Map<string, { amount: number; limit: number | null }>();
    for (const t of transactions.filter((t) => t.type === "DEPENSE")) {
        const existing = categoryMap.get(t.categorie.nom) || { amount: 0, limit: t.categorie.limit };
        categoryMap.set(t.categorie.nom, {
            amount: existing.amount + t.montant,
            limit: t.categorie.limit,
        });
    }
    const spendingByCategory = Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        amount: data.amount,
        limit: data.limit,
    }));

    // Budget adherence (for categories with limits)
    const budgetAdherence = spendingByCategory
        .filter((c) => c.limit !== null)
        .map((c) => ({
            category: c.name,
            spent: c.amount,
            limit: c.limit!,
            status: c.amount <= c.limit! * 0.7 ? "good" : c.amount <= c.limit! ? "warning" : "danger",
        }));

    // Top 5 transactions
    const topTransactions = transactions
        .filter((t) => t.type === "DEPENSE")
        .slice(0, 5)
        .map((t) => ({
            description: t.description,
            amount: t.montant,
            category: t.categorie.nom,
            date: t.date,
        }));

    // Savings rate
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0;

    return {
        totalSpending,
        totalIncome,
        spendingByCategory,
        budgetAdherence,
        topTransactions,
        savingsRate,
    };
}

/**
 * Generate a natural language summary from the weekly data using Gemini
 */
export async function generateSummaryText(data: WeeklyData, weekStart: Date): Promise<string> {
    const prompt = `
You are a financial analyst creating a weekly summary for a user's spending behavior.
Generate a concise, informative summary (3-5 sentences) based on this data:

Week starting: ${weekStart.toISOString().split("T")[0]}
Total Income: ${data.totalIncome} MAD
Total Spending: ${data.totalSpending} MAD
Savings Rate: ${data.savingsRate.toFixed(1)}%

Spending by Category:
${data.spendingByCategory.map((c) => `- ${c.name}: ${c.amount} MAD${c.limit ? ` (limit: ${c.limit} MAD)` : ""}`).join("\n")}

Budget Status:
${data.budgetAdherence.map((b) => `- ${b.category}: ${b.status.toUpperCase()} (${b.spent}/${b.limit} MAD)`).join("\n")}

Top Expenses:
${data.topTransactions.map((t) => `- ${t.description}: ${t.amount} MAD (${t.category})`).join("\n")}

Write a friendly, actionable summary highlighting key patterns and any concerns.
Do not use markdown formatting.
`;

    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Summary generation error:", error);
        // Fallback to structured summary
        return `Week of ${weekStart.toISOString().split("T")[0]}: Spent ${data.totalSpending} MAD across ${data.spendingByCategory.length} categories. Savings rate: ${data.savingsRate.toFixed(1)}%.`;
    }
}

/**
 * Store a weekly summary with its embedding in the database
 */
export async function storeSummaryWithEmbedding(
    userId: number,
    summary: string,
    weekStart: Date,
    weekEnd: Date
): Promise<void> {
    // Generate embedding for the summary
    const embedding = await generateEmbedding(summary);

    if (!embedding) {
        console.error("Failed to generate embedding for summary");
        return;
    }

    const vectorString = formatVectorForPg(embedding);

    // Use raw SQL because Prisma doesn't natively support vector type
    await prisma.$executeRawUnsafe(`
    INSERT INTO "WeeklySummary" ("utilisateurId", "weekStart", "weekEnd", "summary", "embedding", "createdAt")
    VALUES ($1, $2, $3, $4, $5::vector, NOW())
    ON CONFLICT ("utilisateurId", "weekStart") 
    DO UPDATE SET "summary" = $4, "embedding" = $5::vector, "createdAt" = NOW()
  `, userId, weekStart, weekEnd, summary, vectorString);

    console.log(`✅ Stored weekly summary for user ${userId}, week of ${weekStart.toISOString()}`);
}

/**
 * Retrieve the most relevant past summaries based on semantic similarity
 */
export async function retrieveRelevantSummaries(
    userId: number,
    query: string,
    limit: number = 5
): Promise<{ summary: string; weekStart: Date; similarity: number }[]> {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    if (!queryEmbedding) {
        console.error("Failed to generate query embedding");
        return [];
    }

    const vectorString = formatVectorForPg(queryEmbedding);

    // Use cosine similarity search
    const results = await prisma.$queryRawUnsafe<
        { summary: string; weekStart: Date; similarity: number }[]
    >(`
    SELECT 
      summary,
      "weekStart",
      1 - (embedding <=> $1::vector) as similarity
    FROM "WeeklySummary"
    WHERE "utilisateurId" = $2
      AND embedding IS NOT NULL
    ORDER BY embedding <=> $1::vector
    LIMIT $3
  `, vectorString, userId, limit);

    return results;
}

/**
 * Generate and store a weekly summary for a user
 */
export async function processWeeklySummary(
    userId: number,
    weekStart: Date,
    weekEnd: Date
): Promise<void> {
    console.log(`📊 Processing weekly summary for user ${userId}...`);

    // 1. Aggregate the week's data
    const weeklyData = await aggregateWeeklyData(userId, weekStart, weekEnd);

    // Skip if no activity
    if (weeklyData.totalSpending === 0 && weeklyData.totalIncome === 0) {
        console.log(`⏭️ Skipping user ${userId} - no activity this week`);
        return;
    }

    // 2. Generate natural language summary
    const summaryText = await generateSummaryText(weeklyData, weekStart);

    // 3. Store with embedding
    await storeSummaryWithEmbedding(userId, summaryText, weekStart, weekEnd);
}
