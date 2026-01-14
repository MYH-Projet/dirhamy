import { PrismaClient, TypeCompte, TypeTransaction } from '../generated/prisma/client'; 
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config";
import pg from "pg";
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({connectionString});

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Cleanup: Delete existing data to prevent conflicts (Order matters due to Foreign Keys)
  // We use deleteMany() instead of truncating to be safe with FK constraints
  await prisma.balanceSnapshot.deleteMany();
  await prisma.budgetSnapshot.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.compte.deleteMany();
  await prisma.utilisateur.deleteMany();

  console.log('🧹 Database cleaned');

  // 2. Create a User
  // In a real app, you would hash this password using bcrypt. 
  // For seeding, we'll use a dummy hash or plain text depending on your auth setup.
  const user = await prisma.utilisateur.create({
    data: {
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
      motDePasse: await bcrypt.hash('password123',10), // Example hash for "password123"
    },
  });

  console.log(`👤 Created User: ${user.email}`);

  // 3. Create Categories
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

  // 4. Create Accounts
  const bankAccount = await prisma.compte.create({
    data: { nom: 'Main Bank', type: TypeCompte.Banque, utilisateurId: user.id },
  });

  const cashWallet = await prisma.compte.create({
    data: { nom: 'Cash Wallet', type: TypeCompte.Cash, utilisateurId: user.id },
  });

  // 5. Create Transactions (History for the current month and last month)
  const today = new Date();
  const lastMonth = new Date(new Date().setMonth(today.getMonth() - 1));

  // --- Last Month Transactions ---
  
  // Salary Income
  await prisma.transaction.create({
    data: {
      montant: 3000.0,
      type: TypeTransaction.REVENU,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1), // 1st of last month
      description: 'Monthly Salary',
      compteId: bankAccount.id,
      categorieId: catSalary.id,
    },
  });

  // Rent Expense
  await prisma.transaction.create({
    data: {
      montant: 1200.0,
      type: TypeTransaction.DEPENSE,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 2),
      description: 'December Rent',
      compteId: bankAccount.id,
      categorieId: catRent.id,
    },
  });

  // ATM Withdrawal (Transfer from Bank to Cash)
  // Note: Transfers need a source (compteId) and destination (idDestination)
  await prisma.transaction.create({
    data: {
      montant: 200.0,
      type: TypeTransaction.TRANSFER,
      date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
      description: 'ATM Withdrawal',
      compteId: bankAccount.id, // Source
      idDestination: cashWallet.id, // Destination
      categorieId: catTransport.id, // Just tagging it generally, or you might have a "Transfer" category
    },
  });

  // --- This Month Transactions ---

  // Grocery Shopping (Cash)
  await prisma.transaction.create({
    data: {
      montant: 85.50,
      type: TypeTransaction.DEPENSE,
      date: new Date(), // Now
      description: 'Supermarket Run',
      compteId: cashWallet.id,
      categorieId: catGroceries.id,
    },
  });

  console.log('💸 Created Transactions');

  // 6. Create Snapshots
  
  // Budget Snapshot (e.g., How much we spent on Groceries last month)
  // Let's pretend last month we spent 450 out of 500 limit on Groceries
  await prisma.budgetSnapshot.create({
    data: {
      monthDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1), // First day of last month
      limit: 500.0,
      spend: 450.0,
      categorieId: catGroceries.id,
    },
  });

  // Balance Snapshot (e.g., Record what the Bank Account balance was 10 days ago)
  // This is useful for drawing charts of balance history
  await prisma.balanceSnapshot.create({
    data: {
      date: new Date(new Date().setDate(today.getDate() - 10)), // 10 days ago
      solde: 1800.0, // Calculated balance at that time
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