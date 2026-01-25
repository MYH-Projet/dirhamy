import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../helpers/request';
import { registerAndLogin } from '../helpers/authHelper';
import { createTestAccount, createTestCategory } from '../helpers/factories';

describe('Balance Integration', () => {
    let auth: { user: any, cookies: string[] };

    beforeEach(async () => {
        auth = await registerAndLogin();
    });

    describe('GET /balance', () => {
        it('should return current balance 0 for new user', async () => {
            const response = await api.get('/balance')
                .set('Cookie', auth.cookies);

            expect(response.status).toBe(200);
            expect(Number(response.body.totalBalance)).toBe(0);
        });

        it('should return correct balance with transactions', async () => {
            // Setup: Create account and transactions
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);
            const { createTestTransaction } = await import('../helpers/factories');
            const { TypeTransaction } = await import('../../generated/prisma/enums');

            // Income +100
            await createTestTransaction(account.id, category.id, {
                montant: 100,
                type: TypeTransaction.REVENU
            });

            // Expense -30
            await createTestTransaction(account.id, category.id, {
                montant: -30,
                type: TypeTransaction.DEPENSE
            });

            const response = await api.get('/balance')
                .set('Cookie', auth.cookies);

            expect(response.status).toBe(200);
            // Assuming default implementation: 100 - 30 = 70.
            // Or if expense stores as negative in DB: 100 + (-30) = 70.
            // My previous transaction test showed it returning negative for DEPENSE.
            expect(Number(response.body.totalBalance)).toBe(70);
        });

        it('should update balance after deleting a transaction', async () => {
            const account = await createTestAccount(auth.user.id);
            const category = await createTestCategory(auth.user.id);
            const { createTestTransaction } = await import('../helpers/factories');
            const { TypeTransaction } = await import('../../generated/prisma/enums');

            // +100
            const tx = await createTestTransaction(account.id, category.id, {
                montant: 100,
                type: TypeTransaction.REVENU
            });

            // Check initial balance
            const res1 = await api.get('/balance').set('Cookie', auth.cookies);
            expect(Number(res1.body.totalBalance)).toBe(100);

            // Delete transaction
            await api.delete(`/transactions/${tx.id}`).set('Cookie', auth.cookies);

            // Check updated balance
            const res2 = await api.get('/balance').set('Cookie', auth.cookies);
            expect(Number(res2.body.totalBalance)).toBe(0);
        });
    });
});
