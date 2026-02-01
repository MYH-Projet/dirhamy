import { PrismaClient, TypeCompte, TypeTransaction } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import "dotenv/config";
import pg from "pg";
import bcrypt from 'bcryptjs';

// 1. Setup Database Connection with Driver Adapter
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // ---------------------------------------------------------
  // 1. CLEANUP
  // ---------------------------------------------------------
  // Order is critical due to Foreign Key constraints
  await prisma.balanceSnapshot.deleteMany();
  await prisma.budgetSnapshot.deleteMany();

  // Transactions depend on Transfers, so delete transactions first
  await prisma.transaction.deleteMany();
  // Now safe to delete Transfers
  await prisma.transfer.deleteMany();

  await prisma.categorie.deleteMany();
  await prisma.compte.deleteMany();

  // Delete AI-related tables before user
  await prisma.weeklySummary.deleteMany();
  await prisma.chatMessage.deleteMany();

  await prisma.utilisateur.deleteMany();

  console.log('🧹 Database cleaned');


  // ---------------------------------------------------------
  // 2. USER & BASICS
  // ---------------------------------------------------------
  const user = await prisma.utilisateur.create({
    data: {
      nom: 'Charkaoui',
      prenom: 'Mohamed Anas',
      email: 'mac@example.com',
      motDePasse: await bcrypt.hash('password123', 10),
    },
  });

  console.log(`👤 Created User: ${user.email}`);

  // Create Categories
  const catGroceries = await prisma.categorie.create({
    data: { nom: 'Groceries', limit: 500.0, utilisateurId: user.id },
  });
  const catRent = await prisma.categorie.create({
    data: { nom: 'Rent', limit: 1200.0, utilisateurId: user.id },
  });
  const catSalary = await prisma.categorie.create({
    data: { nom: 'Salary', limit: null, utilisateurId: user.id },
  });
  const catTransport = await prisma.categorie.create({
    data: { nom: 'Transport', limit: 100.0, utilisateurId: user.id },
  });

  // Create Accounts
  const bankAccount = await prisma.compte.create({
    data: { nom: 'Main Bank', type: TypeCompte.Banque, utilisateurId: user.id },
  });

  const cashWallet = await prisma.compte.create({
    data: { nom: 'Cash Wallet', type: TypeCompte.Cash, utilisateurId: user.id },
  });

  // ---------------------------------------------------------
  // 3. TRANSACTIONS
  // ---------------------------------------------------------
  const today = new Date();
  const lastMonth = new Date(new Date().setMonth(today.getMonth() - 1));

  // --- A. Salary Income (Single Entry) ---
  await prisma.transaction.create({
    data: {
      montant: 3000.0,
      type: TypeTransaction.REVENU,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      description: 'Monthly Salary',
      compteId: bankAccount.id,
      categorieId: catSalary.id,
    },
  });

  // --- B. Rent Expense (Single Entry) ---
  await prisma.transaction.create({
    data: {
      montant: -1200.0,
      type: TypeTransaction.DEPENSE,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 2),
      description: 'December Rent',
      compteId: bankAccount.id,
      categorieId: catRent.id,
    },
  });

  // --- C. ATM Withdrawal (TRANSFER) ---
  // We use the 'Transfer' model to link the withdrawal and deposit
  const transferDate = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5);

  await prisma.transfer.create({
    data: {
      createdAt: transferDate,
      // Nested write: Create the two transactions immediately
      transactions: {
        create: [
          // 1. Money leaving Bank (Negative)
          {
            montant: -200.0,
            type: TypeTransaction.TRANSFER,
            date: transferDate,
            description: 'ATM Withdrawal - Out',
            compteId: bankAccount.id,
            categorieId: catTransport.id,
            idDestination: cashWallet.id
          },
          // 2. Money entering Cash (Positive)
          {
            montant: 200.0,
            type: TypeTransaction.TRANSFER,
            date: transferDate,
            description: 'ATM Withdrawal - In',
            compteId: cashWallet.id,
            categorieId: catTransport.id,
            idDestination: bankAccount.id
          }
        ]
      }
    }
  });

  // --- D. Grocery Shopping (Current Month) ---
  await prisma.transaction.create({
    data: {
      montant: -85.50,
      type: TypeTransaction.DEPENSE,
      date: new Date(),
      description: 'Supermarket Run',
      compteId: cashWallet.id,
      categorieId: catGroceries.id,
    },
  });

  console.log('💸 Created Transactions');

  // ---------------------------------------------------------
  // 4. SNAPSHOTS
  // ---------------------------------------------------------

  // Budget Snapshot (for Groceries last month)
  await prisma.budgetSnapshot.create({
    data: {
      monthDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      limit: 500.0,
      spend: 450.0,
      categorieId: catGroceries.id,
    },
  });

  // Balance Snapshot (Bank account balance from 10 days ago)
  await prisma.balanceSnapshot.create({
    data: {
      date: new Date(new Date().setDate(today.getDate() - 10)),
      solde: 1600.0,
      compteId: bankAccount.id,
    },
  });

  console.log('📸 Created Snapshots');
  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });