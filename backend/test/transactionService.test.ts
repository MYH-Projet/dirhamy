import { describe, test, expect, beforeEach, vi } from 'vitest';
import { createTransaction, checkAccount } from "../src/services/transactionServices";
import { prisma } from '../src/lib/prisma';
import { AppError } from '../src/utils/AppError';
import { TypeTransaction } from "../generated/prisma/enums"; 
// You still import these for typing usage below, but NOT for the mock factory
import { DeepMockProxy } from 'vitest-mock-extended';
import { PrismaClient } from '../generated/prisma/client';

// 1. Mock Prisma with Dynamic Import
vi.mock('../src/lib/prisma', async () => {
  // IMPORT INSIDE here to fix the hoisting reference error
  const { mockDeep } = await import('vitest-mock-extended');
  
  return {
    prisma: mockDeep<PrismaClient>(),
  };
});

// 2. Typecast the mock for IntelliSense
const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
describe('Transaction Service', () => {
  
  beforeEach(() => {
    vi.clearAllMocks(); // Using 'vi' instead of 'jest'
  });

  describe('checkAccount', () => {
    test('should throw 403 if account does not belong to user', async () => {
      prismaMock.compte.findFirst.mockResolvedValue(null);

      await expect(checkAccount(1, 999))
        .rejects
        .toThrow(new AppError("Forbidden: You do not own this source account", 403));
    });

    test('should succeed if account exists', async () => {
      // @ts-ignore
      prismaMock.compte.findFirst.mockResolvedValue({ id: 1, utilisateurId: 1 });

      await expect(checkAccount(1, 1)).resolves.not.toThrow();
    });
  });

  describe('createTransaction', () => {
    beforeEach(() => {
        // Fix: Explicitly handle the transaction callback
        prismaMock.$transaction.mockImplementation((callback) => callback(prismaMock));
    });

    test('should create a TRANSFER (Double Entry) correctly', async () => {
      const inputData = {
        montant: 100,
        type: TypeTransaction.TRANSFER,
        description: 'Test Transfer',
        date: new Date(),
        compteId: 1,
        categorieId: 2,
        idDestination: 5
      };

      await createTransaction(inputData);

      // 1. Check Sender
      expect(prismaMock.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            montant: -100, 
            compteId: 1,
            idDestination: 5
        })
      }));

      // 2. Check Receiver
      expect(prismaMock.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            montant: 100, 
            compteId: 5,
            idDestination: 1
        })
      }));

      // 3. Check Snapshots
      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledTimes(2);
    });

    test('should create a DEPENSE (Single Entry) with negative sign', async () => {
      const inputData = {
        montant: 50,
        type: TypeTransaction.DEPENSE,
        description: 'Groceries',
        date: new Date(),
        compteId: 1,
        categorieId: 3,
        idDestination: null
      };

      // @ts-ignore
      prismaMock.transaction.create.mockResolvedValue({ id: 123, ...inputData, montant: -50 });

      const result = await createTransaction(inputData);

      expect(prismaMock.transaction.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
            montant: -50,
            type: 'DEPENSE'
        })
      }));

      expect(prismaMock.balanceSnapshot.updateMany).toHaveBeenCalledTimes(1);
    });
  });
});