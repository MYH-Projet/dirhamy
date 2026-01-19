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
        // IMPORTANT: Mock the $transaction to immediately execute the callback
        // This simulates the transaction logic without a real DB
        prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));
    });

    test('should create a TRANSFER (Double Entry) using Parent Transfer Table', async () => {
      const inputData = {
        montant: 100,
        type: TypeTransaction.TRANSFER,
        description: 'Test Transfer',
        date: new Date('2025-01-01'),
        compteId: 1, // Source
        categorieId: 2,
        idDestination: 5 // Destination
      };

      // Mock the return value for transfer.create
      // @ts-ignore
      prismaMock.transfer.create.mockResolvedValue({ id: 10, createdAt: new Date() });

      await createTransaction(inputData);

      // 1. Verify we called transfer.create (NOT transaction.create directly)
      expect(prismaMock.transfer.create).toHaveBeenCalledTimes(1);
      
      // 2. Verify the correct arguments were passed (Nested Writes)
      expect(prismaMock.transfer.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            transactions: {
                create: [
                    // Expect 1st Transaction: Sender (Negative)
                    expect.objectContaining({
                        montant: -100, 
                        compteId: 1,
                        type: TypeTransaction.TRANSFER
                    }),
                    // Expect 2nd Transaction: Receiver (Positive)
                    expect.objectContaining({
                        montant: 100, 
                        compteId: 5,
                        type: TypeTransaction.TRANSFER
                    })
                ]
            }
        }),
        include: { transactions: true }
      }));

      // 3. Verify Snapshots were updated twice (once for each account)
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledTimes(2);
      
      // Check Source Update (Decrement/Negative logic handled in service)
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

    test('should create a DEPENSE (Single Entry) with negative sign', async () => {
      const inputData = {
        montant: 50,
        type: TypeTransaction.DEPENSE,
        description: 'Groceries',
        date: new Date(),
        compteId: 1,
        categorieId: 3,
        // idDestination is undefined or null
      };

      // @ts-ignore
      prismaMock.transaction.create.mockResolvedValue({ id: 123, ...inputData, montant: -50 });

      await createTransaction(inputData);

      // 1. Verify single transaction creation
      expect(prismaMock.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            montant: -50, // Should be negative
            type: TypeTransaction.DEPENSE,
            compteId: 1
        })
      }));

      // 2. Verify Snapshots updated once
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledTimes(1);
      
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledWith(expect.objectContaining({
          where: expect.objectContaining({ compteId: 1 }),
          data: { solde: { increment: -50 } }
      }));
    });
  });
});