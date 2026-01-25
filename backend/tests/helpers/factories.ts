import { getPrisma } from './testDb';
import bcrypt from 'bcryptjs';
import { TypeCompte, TypeTransaction } from '../../generated/prisma/enums'; // Enums usually in enums.ts

export const createTestUser = async (overrides: any = {}) => {
    const prisma = getPrisma();
    const plainPassword = overrides.motDePasse || 'password123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Remove motDePasse from overrides so it doesn't overwrite our hash
    const { motDePasse, ...restOverrides } = overrides;

    return prisma.utilisateur.create({
        data: {
            nom: 'Test',
            prenom: 'User',
            email: `test${Date.now()}@example.com`,
            motDePasse: hashedPassword,
            ...restOverrides,
        },
    });
};

export const createTestAccount = async (userId: number, overrides: any = {}) => {
    const prisma = getPrisma();
    return prisma.compte.create({
        data: {
            nom: 'Main Account',
            type: TypeCompte.Banque,
            utilisateurId: userId,
            ...overrides
        }
    });
};

export const createTestCategory = async (userId: number, overrides: any = {}) => {
    const prisma = getPrisma();
    return prisma.categorie.create({
        data: {
            nom: 'Groceries',
            limit: 1000,
            utilisateurId: userId,
            ...overrides
        }
    });
};

export const createTestTransaction = async (accountId: number, categoryId: number, overrides: any = {}) => {
    const prisma = getPrisma();
    return prisma.transaction.create({
        data: {
            montant: 50.0,
            type: TypeTransaction.DEPENSE,
            description: 'Test transaction',
            compteId: accountId,
            categorieId: categoryId,
            date: new Date(),
            ...overrides
        }
    });
};
