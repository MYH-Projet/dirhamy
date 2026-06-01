/**
 * RAG System Test Script
 * Run with: npx tsx src/scripts/test-rag.ts
 * Or in Docker: docker exec dirhamy-backend npx tsx src/scripts/test-rag.ts
 */

import { prisma } from "../lib/prisma";
import { generateEmbedding } from "../services/embeddingService";
import {
    aggregateWeeklyData,
    generateSummaryText,
    storeSummaryWithEmbedding,
    retrieveRelevantSummaries,
    processWeeklySummary,
} from "../services/weeklySummaryService";
import { backfillWeeklySummaries } from "../jobs/weeklySummaryJob";

async function testEmbedding() {
    console.log("\n🧪 TEST 1: Embedding Generation");
    console.log("================================");

    const testText = "User spent 500 MAD on food this week, which is over budget.";
    console.log(`Input: "${testText}"`);

    const embedding = await generateEmbedding(testText);

    if (embedding) {
        console.log(`✅ Embedding generated successfully!`);
        console.log(`   Dimensions: ${embedding.length}`);
        console.log(`   First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(", ")}...]`);
        return true;
    } else {
        console.log("❌ Failed to generate embedding");
        return false;
    }
}

async function testDataAggregation(userId: string) {
    console.log("\n🧪 TEST 2: Data Aggregation");
    console.log("===========================");

    // Get last week's range
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    console.log(`User ID: ${userId}`);
    console.log(`Week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

    const data = await aggregateWeeklyData(userId, weekStart, weekEnd);

    console.log(`✅ Data aggregated:`);
    console.log(`   Total Income: ${data.totalIncome} MAD`);
    console.log(`   Total Spending: ${data.totalSpending} MAD`);
    console.log(`   Savings Rate: ${data.savingsRate.toFixed(1)}%`);
    console.log(`   Categories: ${data.spendingByCategory.map(c => c.name).join(", ") || "None"}`);
    console.log(`   Top Transactions: ${data.topTransactions.length}`);

    return data;
}

async function testSummaryGeneration(userId: string) {
    console.log("\n🧪 TEST 3: AI Summary Generation");
    console.log("=================================");

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);

    const data = await aggregateWeeklyData(userId, weekStart, weekEnd);

    if (data.totalSpending === 0 && data.totalIncome === 0) {
        console.log("⚠️ No transactions found for this week. Skipping summary generation.");
        return null;
    }

    console.log("Generating AI summary...");
    const summary = await generateSummaryText(data, weekStart);

    console.log(`✅ Summary generated (${summary.length} chars):`);
    console.log(`   "${summary.substring(0, 200)}..."`);

    return summary;
}

async function testStorageAndRetrieval(userId: string) {
    console.log("\n🧪 TEST 4: Storage & Vector Retrieval");
    console.log("=====================================");

    // First, generate and store a summary
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setMilliseconds(-1);

    console.log("Processing weekly summary...");
    await processWeeklySummary(userId, weekStart, weekEnd);

    // Check if it was stored
    const stored = await prisma.weeklySummary.count({
        where: { utilisateurId: userId },
    });
    console.log(`✅ Summaries stored for user: ${stored}`);

    // Test retrieval
    const query = "How is my spending on food?";
    console.log(`\nTesting vector retrieval with query: "${query}"`);

    const results = await retrieveRelevantSummaries(userId, query, 3);

    if (results.length > 0) {
        console.log(`✅ Retrieved ${results.length} relevant summaries:`);
        results.forEach((r, i) => {
            console.log(`   ${i + 1}. Week of ${r.weekStart.toISOString().split("T")[0]} (similarity: ${r.similarity.toFixed(4)})`);
            console.log(`      "${r.summary.substring(0, 100)}..."`);
        });
    } else {
        console.log("⚠️ No summaries retrieved (this is expected if no embeddings exist yet)");
    }

    return results;
}

async function testBackfill(userId: string) {
    console.log("\n🧪 TEST 5: Backfill Historical Summaries");
    console.log("=========================================");

    console.log(`Backfilling 4 weeks for user ${userId}...`);
    await backfillWeeklySummaries(userId, 4);

    // Count total summaries
    const count = await prisma.weeklySummary.count({
        where: { utilisateurId: userId },
    });
    console.log(`✅ Total summaries for user: ${count}`);
}

async function main() {
    console.log("🚀 RAG System Test Suite");
    console.log("========================\n");

    try {
        // Get the first user for testing
        const user = await prisma.utilisateur.findFirst();
        if (!user) {
            console.log("❌ No users found in database. Please seed the database first.");
            process.exit(1);
        }

        console.log(`Using test user: ${user.email} (ID: ${user.id})`);

        // Run tests
        const embeddingOk = await testEmbedding();
        if (!embeddingOk) {
            console.log("\n❌ Embedding test failed. Check your GEMINI_API_KEY.");
            process.exit(1);
        }

        await testDataAggregation(user.id);
        await testSummaryGeneration(user.id);
        await testStorageAndRetrieval(user.id);
        await testBackfill(user.id);

        console.log("\n✅ All tests completed!");
        console.log("========================");
        console.log("The RAG system is working. You can now use the chatbot!");

    } catch (error) {
        console.error("\n❌ Test failed with error:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
