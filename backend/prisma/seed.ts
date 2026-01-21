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

  // 1. Cleanup: Delete existing data to prevent conflicts 
  // Order is critical due to Foreign Key constraints:
  // Transaction -> depends on Transfer (optional) and Compte
  // Transfer -> Independent (but Transactions point to it)
  
  await prisma.balanceSnapshot.deleteMany();
  await prisma.budgetSnapshot.deleteMany();
  
  // Delete Transactions first (because they point to Transfers)
  await prisma.transaction.deleteMany();
  // Now safe to delete Transfers
  await prisma.transfer.deleteMany();
  
  await prisma.categorie.deleteMany();
  await prisma.compte.deleteMany();
  await prisma.utilisateur.deleteMany();

  console.log('🧹 Database cleaned');

  // 2. Create a User
  const user = await prisma.utilisateur.create({
    data: {
      nom: 'Doe',
      prenom: 'John',
      email: 'john.doe@example.com',
      motDePasse: await bcrypt.hash('password123', 10), 
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
  
  // A. Salary Income (Single Entry)
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

  // B. Rent Expense (Single Entry)
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

  // C. ATM Withdrawal (Transfer from Bank to Cash) - UPDATED!
  // Uses the new "Transfer" parent model with nested writes
  await prisma.transfer.create({
    data: {
      createdAt: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
      transactions: {
        create: [
          // 1. Withdraw from Bank (Negative)
          {
            montant: -200.0,
            type: TypeTransaction.TRANSFER,
            date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
            description: 'ATM Withdrawal - Out',
            compteId: bankAccount.id,
            categorieId: catTransport.id,
          },
          // 2. Deposit to Cash (Positive)
          {
            montant: 200.0,
            type: TypeTransaction.TRANSFER,
            date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5),
            description: 'ATM Withdrawal - In',
            compteId: cashWallet.id,
            categorieId: catTransport.id,
          }
        ]
      }
    }
  });

  // --- This Month Transactions ---

  // D. Grocery Shopping (Single Entry)
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

  // 6. Create Snapshots
  
  // Budget Snapshot
  await prisma.budgetSnapshot.create({
    data: {
      monthDate: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
      limit: 500.0,
      spend: 450.0,
      categorieId: catGroceries.id,
    },
  });

  // Balance Snapshot (Bank account balance as of 10 days ago)
  // Logic: 3000 (salary) - 1200 (rent) - 200 (transfer) = 1600 theoretical balance
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