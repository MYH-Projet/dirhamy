// prisma/seed.ts
import { TypeCompte, TypeTransaction } from '../generated/prisma/client'; // Your custom path
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Starting seed...')

  // 1. Clean up the database (Order matters for Foreign Keys!)
  // We must delete the children (Snapshots/Transactions) before the parents (Accounts)
  await prisma.balanceSnapshot.deleteMany() // <--- NEW: Clean up snapshots
  await prisma.transaction.deleteMany()
  await prisma.categorie.deleteMany()
  await prisma.compte.deleteMany()
  await prisma.utilisateur.deleteMany()
  
  console.log('🧹 Database cleaned.')

  // 2. Create User and Categories
  // Note: We removed 'solde' from the account creation because that column no longer exists.
  // We will add "Initial Deposit" transactions later to set the starting money.
  const user = await prisma.utilisateur.create({
    data: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@test.com',
      motDePasse: 'supersecret123', 
      
      comptes: {
        create: [
          { nom: 'Portefeuille (Cash)', type: TypeCompte.Cash },
          { nom: 'Compte Courant (Banque)', type: TypeCompte.Banque },
        ],
      },

      categories: {
        create: [
          { nom: 'Alimentation' },
          { nom: 'Salaire' },
          { nom: 'Transport' },
          { nom: 'Loisirs' },
          { nom: 'Virement Interne' }, 
          { nom: 'Solde Initial' } // Added for initial deposits
        ],
      },
    },
    include: {
      comptes: true,
      categories: true,
    },
  })

  console.log(`👤 Created user: ${user.prenom} ${user.nom}`)

  // 3. Retrieve IDs
  const cashAccount = user.comptes.find(c => c.type === TypeCompte.Cash)!
  const bankAccount = user.comptes.find(c => c.type === TypeCompte.Banque)!

  const catFood = user.categories.find(c => c.nom === 'Alimentation')!
  const catSalary = user.categories.find(c => c.nom === 'Salaire')!
  const catTransfer = user.categories.find(c => c.nom === 'Virement Interne')!
  const catInitial = user.categories.find(c => c.nom === 'Solde Initial')!

  // 4. Create Transactions
  console.log('💸 Creating transactions...')

  // --- Step A: Set Initial Balances (Since we removed 'solde' column) ---
  // We create "Fake" income to represent the money they started with.
  await prisma.transaction.createMany({
    data: [
      {
        montant: 50.00, // Positive (Income)
        type: TypeTransaction.REVENU,
        description: 'Solde au démarrage',
        date: new Date('2023-10-01T00:00:00Z'), // Old date
        compteId: cashAccount.id,
        categorieId: catInitial.id
      },
      {
        montant: 1500.00, // Positive (Income)
        type: TypeTransaction.REVENU,
        description: 'Solde au démarrage',
        date: new Date('2023-10-01T00:00:00Z'),
        compteId: bankAccount.id,
        categorieId: catInitial.id
      }
    ]
  })

  // --- Step B: Regular Transactions ---

  // 1. Income (Salary)
  await prisma.transaction.create({
    data: {
      montant: 2500.00, // Positive
      type: TypeTransaction.REVENU,
      description: 'Salaire Octobre',
      date: new Date('2023-10-28T09:00:00Z'),
      compteId: bankAccount.id,
      categorieId: catSalary.id,
    },
  })

  // 2. Expense (Lunch) -> IMPORTANT: Use Negative Number for Expenses
  // This allows our Snapshot Worker to just SUM() the column.
  await prisma.transaction.create({
    data: {
      montant: -12.50, // <--- NEGATIVE because it is money leaving
      type: TypeTransaction.DEPENSE,
      description: 'Sandwicherie',
      date: new Date('2023-10-29T12:30:00Z'),
      compteId: cashAccount.id,
      categorieId: catFood.id,
    },
  })

  // 3. Transfer (Bank -> Cash)
  // We use an interactive transaction to create TWO records.
  // Record 1: Remove money from Bank
  // Record 2: Add money to Cash
  // This ensures both accounts update correctly in your Snapshot Worker.
  await prisma.$transaction(async (tx) => {
      const amount = 100.00;

      // Sender (Bank) - Negative Amount
      await tx.transaction.create({
        data: {
            montant: -amount, // Negative
            type: TypeTransaction.TRANSFER,
            description: 'Retrait Distributeur (Envoi)',
            date: new Date('2023-10-30T18:00:00Z'),
            compteId: bankAccount.id,      // Linked to Bank
            idDestination: cashAccount.id, // Just for reference
            categorieId: catTransfer.id,
        },
      })

      // Receiver (Cash) - Positive Amount
      await tx.transaction.create({
        data: {
            montant: amount, // Positive
            type: TypeTransaction.TRANSFER,
            description: 'Retrait Distributeur (Reçu)',
            date: new Date('2023-10-30T18:00:00Z'),
            compteId: cashAccount.id,      // Linked to Cash
            idDestination: bankAccount.id, // Just for reference
            categorieId: catTransfer.id,
        },
      })
  })

  console.log('✅ Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })