import { TypeCompte, TypeTransaction } from '../generated/prisma/client';
import { prisma } from '../lib/prisma';



async function main() {
  console.log('🌱 Starting seed...')

  // 1. Clean up the database (Delete in order to avoid Foreign Key errors)
  await prisma.transaction.deleteMany()
  await prisma.categorie.deleteMany()
  await prisma.compte.deleteMany()
  await prisma.utilisateur.deleteMany()
  console.log('🧹 Database cleaned.')

  // 2. Create a User with Accounts and Categories nested
  // We use "Jean Dupont" as our test subject
  const user = await prisma.utilisateur.create({
    data: {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@test.com',
      motDePasse: 'supersecret123', // In a real app, hash this!
      
      // Create Default Accounts
      comptes: {
        create: [
          { nom: 'Portefeuille (Cash)', type: TypeCompte.Cash, solde: 50.00 },
          { nom: 'Compte Courant (Banque)', type: TypeCompte.Banque, solde: 1500.00 },
        ],
      },

      // Create Standard Categories
      categories: {
        create: [
          { nom: 'Alimentation' },
          { nom: 'Salaire' },
          { nom: 'Transport' },
          { nom: 'Loisirs' },
          { nom: 'Virement Interne' }, // Useful for transfers
        ],
      },
    },
    include: {
      comptes: true,
      categories: true,
    },
  })

  console.log(`👤 Created user: ${user.prenom} ${user.nom}`)

  // 3. Retrieve IDs for the created items to link Transactions correctly
  const cashAccount = user.comptes.find(c => c.type === TypeCompte.Cash)!
  const bankAccount = user.comptes.find(c => c.type === TypeCompte.Banque)!

  const catFood = user.categories.find(c => c.nom === 'Alimentation')!
  const catSalary = user.categories.find(c => c.nom === 'Salaire')!
  const catTransfer = user.categories.find(c => c.nom === 'Virement Interne')!

  // 4. Create Transactions
  console.log('💸 Creating transactions...')

  // Transaction A: Income (Salary received in Bank)
  await prisma.transaction.create({
    data: {
      montant: 2500.00,
      type: TypeTransaction.REVENU,
      description: 'Salaire Octobre',
      date: new Date('2023-10-28T09:00:00Z'),
      compteId: bankAccount.id,
      categorieId: catSalary.id,
    },
  })

  // Transaction B: Expense (Buying lunch with Cash)
  await prisma.transaction.create({
    data: {
      montant: 12.50,
      type: TypeTransaction.DEPENSE,
      description: 'Sandwicherie',
      date: new Date('2023-10-29T12:30:00Z'),
      compteId: cashAccount.id,
      categorieId: catFood.id,
    },
  })

  // Transaction C: Transfer (Withdrawing money: Bank -> Cash)
  // Note: We record the withdrawal on the Bank account
    await prisma.$transaction(async (tx) => {
        // 1. Create the single Transaction record linking both accounts
        await tx.transaction.create({
        data: {
            montant: 100.00, // Amount is absolute (100), the logic determines direction
            type: TypeTransaction.TRANSFER,
            description: 'Retrait Distributeur',
            date: new Date('2023-10-30T18:00:00Z'),
            compteId: bankAccount.id,       // FROM: Source Account
            idDestination: cashAccount.id,  // TO: Destination Account
            categorieId: catTransfer.id,
        },
        })

        // 2. Decrement the Source Account (Bank)
        await tx.compte.update({
        where: { id: bankAccount.id },
        data: {
            solde: {
            decrement: 100.00 // Prisma atomic decrement
            }
        }
        })

        // 3. Increment the Destination Account (Cash)
        await tx.compte.update({
        where: { id: cashAccount.id },
        data: {
            solde: {
            increment: 100.00 // Prisma atomic increment
            }
        }
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