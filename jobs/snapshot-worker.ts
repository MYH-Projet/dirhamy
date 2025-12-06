// src/jobs/snapshot-worker.ts
import { prisma } from '../lib/prisma'; // Adjust path to your prisma instance
import {CompteModel} from '../generated/prisma/models/Compte'


export async function generateDailySnapshots() {
  console.log('📸 Starting Daily Snapshot Job...');

  const BATCH_SIZE=100;
  let cursorId: number | undefined = undefined;
  let hasMoreData = true;
  let count = 0;

  while(hasMoreData){
    const accounts:CompteModel[] = await prisma.compte.findMany({
      take:BATCH_SIZE,
      skip:cursorId ? 1 : 0,
      cursor: cursorId ? { id: cursorId } : undefined,
      orderBy:{id: 'asc'}
    });

    for (const account of accounts) {
      try {
        // A. Find the previous snapshot (The "Bookmark")
        const lastSnapshot = await prisma.balanceSnapshot.findFirst({
          where: { compteId: account.id },
          orderBy: { date: 'desc' }
        });

        // B. Determine where to start summing from
        const lastSnapshotDate = lastSnapshot?.date || new Date(0); // Year 1970 if no snapshot
        const startBalance = lastSnapshot?.solde || 0;

        // C. Sum only the *new* transactions since the last snapshot
        const recentActivity = await prisma.transaction.aggregate({
          _sum: { montant: true },
          where: {
            compteId: account.id,
            date: { gt: lastSnapshotDate } // Only transactions NEWER than the last snapshot
          }
        });

        const newTransactionsSum = recentActivity._sum.montant || 0;
        const currentBalance = startBalance + newTransactionsSum;

        // D. Write the NEW Snapshot
        // We only save if there was activity, OR if you want a record for every day regardless.
        // Here we save it every time this job runs.
        await prisma.balanceSnapshot.create({
          data: {
            compteId: account.id,
            date: new Date(),
            solde: currentBalance
          }
        });
        
        count++;
      } catch (error) {
        console.error(`❌ Failed to snapshot account ${account.id}`, error);
      }
    }
    cursorId = accounts[accounts.length -1].id;
    if(accounts.length<100){
      hasMoreData=false
    }
  }
  console.log(`✅ Snapshot job finished. Processed ${count} accounts.`);
}