import { describe, it, expect, beforeEach } from 'vitest';
import { api, getCookies } from '../helpers/request';
import { createTestUser, createTestAccount, createTestCategory, createTestTransaction } from '../helpers/factories';
import { registerAndLogin } from '../helpers/authHelper';
import { TypeTransaction } from '../../generated/prisma/enums';

describe('Transactions Integration', () => {
    let auth: { user: any, cookies: string[] };

    beforeEach(async () => {
        auth = await registerAndLogin();
    });

    describe('POST /transactions', () => {
        it('should create a transaction successfully', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);

            const txData = {
                montant: 100,
                type: TypeTransaction.DEPENSE,
                date: new Date().toISOString(),
                description: 'Supermarket',
                compteId: account.id,
                categorieId: category.id
            };

            const response = await api
                .post('/transactions')
                .set('Cookie', auth.cookies)
                .send(txData);

            expect(response.status).toBe(201);
            expect(response.body.description).toBe(txData.description);
            expect(response.body.montant).toBe(-txData.montant);
        });
    });

    describe('GET /transactions/user', () => {
        it('should return user transactions', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);
            await createTestTransaction(account.id, category.id, { description: 'Tx 1' });
            await createTestTransaction(account.id, category.id, { description: 'Tx 2' });

            const response = await api
                .get('/transactions/user')
                .set('Cookie', auth.cookies);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
        });

        it('should NOT return other users transactions', async () => {
            // User A has transactions
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);
            await createTestTransaction(account.id, category.id);

            // User B
            const authB = await registerAndLogin();
            const response = await api.get('/transactions/user').set('Cookie', authB.cookies);

            expect(response.status).toBe(200);
            expect(response.body.data.length).toBe(0);
        });
    });

    describe('Transaction Logic & Validation', () => {
        it('should create a RECEIPT (Recette) with positive amount', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);

            const response = await api.post('/transactions').set('Cookie', auth.cookies).send({
                montant: 200,
                type: TypeTransaction.REVENU,
                date: new Date().toISOString(),
                description: 'Salary',
                compteId: account.id,
                categorieId: category.id
            });

            expect(response.status).toBe(201);
            expect(Number(response.body.montant)).toBe(200); // Should remain positive
        });

        it('should return 400 for invalid amount', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);

            const response = await api.post('/transactions').set('Cookie', auth.cookies).send({
                montant: 'invalid', // Not a number
                type: TypeTransaction.DEPENSE,
                date: new Date().toISOString(),
                compteId: account.id,
                categorieId: category.id
            });
            expect(response.status).toBe(400);
        });

        it('should return 400 for negative amount input (business logic usually enforces positive input)', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);

            // Assuming API expects positive number and flips sign based on type
            const response = await api.post('/transactions').set('Cookie', auth.cookies).send({
                montant: -100,
                type: TypeTransaction.DEPENSE,
                date: new Date().toISOString(),
                compteId: account.id,
                categorieId: category.id
            });
            // Validation might catch this
            expect(response.status).toBe(400);
        });

        it('should return 400 for zero amount', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);
            const response = await api.post('/transactions').set('Cookie', auth.cookies).send({
                montant: 0,
                type: TypeTransaction.DEPENSE,
                date: new Date().toISOString(),
                compteId: account.id,
                categorieId: category.id
            });
            expect(response.status).toBe(400);
        });

        it('should handle huge numbers gracefully (or reject if too big)', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);
            const response = await api.post('/transactions').set('Cookie', auth.cookies).send({
                montant: 999999999999, // very large
                type: TypeTransaction.REVENU,
                date: new Date().toISOString(),
                compteId: account.id,
                categorieId: category.id
            });
            // Usually should pass if it fits in DB (Decimal/Float), or fail if exceeds biz logic
            // Assuming it passes or returns specific error. Let's expect 201 or 400. 
            // Ideally we want to ensure it doesn't crash 500.
            expect(response.status).not.toBe(500);
        });
    });

    describe('DELETE /transactions/:id', () => {
        it('should delete transaction + ownership check', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);
            const tx = await createTestTransaction(account.id, category.id);

            const response = await api.delete(`/transactions/${tx.id}`).set('Cookie', auth.cookies);
            expect(response.status).toBe(200);

            // Verify in DB - endpoint to get by ID usually exists? Or list
            // Assuming we check via list
            const listRes = await api.get('/transactions/user').set('Cookie', auth.cookies);
            expect(listRes.body.data.find((t: any) => t.id === tx.id)).toBeUndefined();
        });

        it('should prevent deleting other users transaction', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);
            const tx = await createTestTransaction(account.id, category.id);

            const authB = await registerAndLogin();
            const response = await api.delete(`/transactions/${tx.id}`).set('Cookie', authB.cookies);

            expect(response.status).toBeOneOf([403, 404]);
        });
    });
});
