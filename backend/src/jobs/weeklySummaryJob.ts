import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { processWeeklySummary } from "../services/weeklySummaryService";

/**
 * Get the start and end of the previous week (Monday 00:00 to Sunday 23:59)
 */
function getPreviousWeekRange(): { weekStart: Date; weekEnd: Date } {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate start of current week (Monday)
    const currentWeekStart = new Date(now);
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(now.getDate() - daysToSubtract);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Previous week = current week start - 7 days
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - 7);

    // Previous week end = current week start - 1 millisecond
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setMilliseconds(weekEnd.getMilliseconds() - 1);

    return { weekStart, weekEnd };
}

/**
 * Process weekly summaries for all users
 */
async function generateAllWeeklySummaries(): Promise<void> {
    console.log("📅 Starting weekly summary generation job...");

    const { weekStart, weekEnd } = getPreviousWeekRange();
    console.log(`📆 Processing week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

    // Get all active users
    const users = await prisma.utilisateur.findMany({
        select: { id: true, email: true },
    });

    console.log(`👥 Found ${users.length} users to process`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
        try {
            await processWeeklySummary(user.id, weekStart, weekEnd);
            successCount++;
        } catch (error) {
            console.error(`❌ Failed to process user ${user.id} (${user.email}):`, error);
            errorCount++;
        }
    }

    console.log(`✅ Weekly summary job completed: ${successCount} success, ${errorCount} errors`);
}

/**
 * Schedule the weekly summary job to run every Sunday at 23:59
 */
export function scheduleWeeklySummaryJob(): void {
    // Cron: At 23:59 on Sunday
    cron.schedule("59 23 * * 0", async () => {
        console.log("⏰ Weekly summary cron triggered");
        try {
            await generateAllWeeklySummaries();
        } catch (error) {
            console.error("❌ Weekly summary job failed:", error);
        }
    });

    console.log("📅 Weekly summary job scheduled (Sundays at 23:59)");
}

/**
 * Manually trigger the weekly summary job (for testing or backfill)
 */
export async function triggerWeeklySummaryJob(): Promise<void> {
    await generateAllWeeklySummaries();
}

/**
 * Generate summaries for past weeks (backfill)
 */
export async function backfillWeeklySummaries(
    userId: number,
    weeksBack: number = 4
): Promise<void> {
    console.log(`🔄 Backfilling ${weeksBack} weeks for user ${userId}...`);

    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    for (let i = 1; i <= weeksBack; i++) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysToSubtract - 7 * i);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        weekEnd.setMilliseconds(weekEnd.getMilliseconds() - 1);

        console.log(`📆 Processing week ${i}: ${weekStart.toISOString()}`);

        try {
            await processWeeklySummary(userId, weekStart, weekEnd);
        } catch (error) {
            console.error(`❌ Failed to process week ${i}:`, error);
        }
    }

    console.log(`✅ Backfill complete for user ${userId}`);
}
