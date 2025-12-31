import { prisma } from '../lib/prisma';

export async function updateBudgetSnapshots() {
  console.log("🔄 Starting Budget Snapshot Update Job...");

  // 1. Determine the current month range
  const now = new Date();
  // Set to first day of current month (e.g., 2025-12-01)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1); 
  // Set to last day of current month
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // 2. Aggregate ALL spending for this month grouped by Category
  const spendingGroups = await prisma.transaction.groupBy({
    by: ['categorieId'],
    where: {
      type: 'DEPENSE',
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
    _sum: {
      montant: true,
    },
  });

  // 3. Update the Snapshot table
  for (const group of spendingGroups) {
    const categoryId = group.categorieId;
    const totalSpent = group._sum.montant || 0;

    // Fetch the category to get the current default limit
    const category = await prisma.categorie.findUnique({ where: { id: categoryId } });
    if (!category) continue;

    // UPSERT: Update if exists, Create if not
    await prisma.budgetSnapshot.upsert({
      where: {
        categorieId_monthDate: {
          categorieId: categoryId,
          monthDate: startOfMonth,
        },
      },
      update: {
        spend: totalSpent, // Update the cached spend amount
        // Optional: Do we update the limit if it changed? Usually, yes, for the current month.
        limit: category.limit || 0 
      },
      create: {
        categorieId: categoryId,
        monthDate: startOfMonth,
        spend: totalSpent,
        limit: category.limit || 0,
      },
    });
  }

  console.log("✅ Budget Snapshot Update Complete.");
}