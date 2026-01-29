import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createTransaction, checkAccount } from "../src/services/transactionServices";
import { prisma } from '../src/lib/prisma';
import { AppError } from '../src/utils/AppError';
import { TypeTransaction } from "../generated/prisma/enums"; 
import { DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '../generated/prisma/client';

// 1. Mock Prisma
vi.mock('../src/lib/prisma', async () => {
  const { mockDeep } = await import('vitest-mock-extended');
  return {
    prisma: mockDeep<PrismaClient>(),
  };
});

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

describe('Transaction Service', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAccount', () => {
    
    test('should throw 403 if account does not belong to user', async () => {
      // 1. Mock: Account not found
      prismaMock.compte.findFirst.mockResolvedValue(null);
      // Category check won't even happen, but good to mock just in case
      // @ts-ignore
      prismaMock.categorie.findFirst.mockResolvedValue({ id: 2, utilisateurId: 1 });

      // Call with: accountId=1, categoryId=2, userId=999
      await expect(checkAccount(1, 2, 999))
        .rejects
        .toThrow(new AppError("Forbidden: You do not own this source account", 403));
    });

    test('should throw 403 if category does not belong to user', async () => {
      // 1. Mock: Account Found (Pass first check)
      // @ts-ignore
      prismaMock.compte.findFirst.mockResolvedValue({ id: 1, utilisateurId: 1 });
      
      // 2. Mock: Category NOT found (Fail second check)
      prismaMock.categorie.findFirst.mockResolvedValue(null);

      // Call with: accountId=1, categoryId=99, userId=1
      await expect(checkAccount(1, 99, 1))
        .rejects
        .toThrow(new AppError("Forbidden: You do not own this category", 403));
    });

    test('should succeed if both account and category exist', async () => {
      // 1. Mock: Both found
      // @ts-ignore
      prismaMock.compte.findFirst.mockResolvedValue({ id: 1, utilisateurId: 1 });
      // @ts-ignore
      prismaMock.categorie.findFirst.mockResolvedValue({ id: 2, utilisateurId: 1 });

      await expect(checkAccount(1, 2, 1)).resolves.not.toThrow();
    });

  });
  describe('createTransaction', () => {
    beforeEach(() => {
        // Mock the $transaction to immediately execute the callback
        prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));
    });

    test('should create a TRANSFER (Double Entry) and update snapshots (Past Date)', async () => {
      // Hardcoded past date ensures snapshot logic is triggered
      const pastDate = new Date('2025-01-01'); 
      
      const inputData = {
        montant: 100,
        type: TypeTransaction.TRANSFER,
        description: 'Test Transfer',
        date: pastDate,
        compteId: 1, // Source
        categorieId: 2,
        idDestination: 5 // Destination
      };

      // @ts-ignore
      prismaMock.transfer.create.mockResolvedValue({ id: 10, createdAt: new Date() });

      await createTransaction(inputData);

      expect(prismaMock.transfer.create).toHaveBeenCalledTimes(1);
      
      // Verify Snapshots updated twice (once for each account) because date is in the past
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledTimes(2);
      
      // Check Source Update (Decrement)
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ compteId: 1 }),
        data: { solde: { decrement: 100 } }
      }));

      // Check Destination Update (Increment)
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ compteId: 5 }),
        data: { solde: { increment: 100 } }
      }));
    });

    test('should create a DEPENSE (Single Entry) and update snapshots if date is in PAST', async () => {
      // 1. Setup a date in the past ("Yesterday")
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const inputData = {
        montant: 50,
        type: TypeTransaction.DEPENSE,
        description: 'Groceries',
        date: yesterday, // <--- Key change: Use yesterday
        compteId: 1,
        categorieId: 3,
      };

      // @ts-ignore
      prismaMock.transaction.create.mockResolvedValue({ id: 123, ...inputData, montant: -50 });

      await createTransaction(inputData);

      // Verify Transaction Creation
      expect(prismaMock.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            montant: -50, 
            type: TypeTransaction.DEPENSE,
            compteId: 1
        })
      }));

      // Verify Snapshots updated (Expectation: 1 call)
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledTimes(1);
      
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ compteId: 1 }),
          data: { solde: { increment: -50 } }
      }));
    });

    test('should create a DEPENSE but SKIP snapshot update if date is TODAY', async () => {
      // 1. Setup a date for "Today"
      const today = new Date();

      const inputData = {
        montant: 50,
        type: TypeTransaction.DEPENSE,
        description: 'Coffee',
        date: today, // <--- Key change: Use Today
        compteId: 1,
        categorieId: 3,
      };

      // @ts-ignore
      prismaMock.transaction.create.mockResolvedValue({ id: 124, ...inputData, montant: -50 });

      await createTransaction(inputData);

      // Verify Transaction Creation still happens
      expect(prismaMock.transaction.create).toHaveBeenCalledTimes(1);

      // Verify Snapshots were NOT touched (Expectation: 0 calls)
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledTimes(0);
    });
  });
});