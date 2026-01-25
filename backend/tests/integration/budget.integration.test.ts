import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../helpers/request';
import { registerAndLogin } from '../helpers/authHelper';
import { createTestCategory } from '../helpers/factories';

describe('Budget Integration', () => {
    let auth: { user: any, cookies: string[] };

    beforeEach(async () => {
        auth = await registerAndLogin();
    });

    describe('GET /budget/status', () => {
        it('should return budget status', async () => {
            const response = await api.get('/budget/status')
                .set('Cookie', auth.cookies);

            expect(response.status).toBe(200);
            // Expect some structure, e.g., total spent, limit
        });
    });

    describe('POST /budget/limit', () => {
        it('should set category limit', async () => {
            const category = await createTestCategory(auth.user.id);
            const response = await api.post('/budget/limit')
                .set('Cookie', auth.cookies)
                .send({ categoryId: category.id, limit: 2000 });

            expect(response.status).toBe(200);
            expect(response.body.category.limit).toBe(2000);
        });

        it('should return error for non-existent category', async () => {
            const response = await api.post('/budget/limit')
                .set('Cookie', auth.cookies)
                .send({ categoryId: 999999, limit: 100 });
            expect(response.status).toBeOneOf([400, 404]);
        });

        it('should prevent setting limit for other users category', async () => {
            const category = await createTestCategory(auth.user.id);

            const authB = await registerAndLogin();
            const response = await api.post('/budget/limit')
                .set('Cookie', authB.cookies)
                .send({ categoryId: category.id, limit: 50 });

            expect(response.status).toBeOneOf([403, 404]);
        });



        it('should allow setting limit to 0 (disable budget or strict)', async () => {
            const category = await createTestCategory(auth.user.id);
            const response = await api.post('/budget/limit')
                .set('Cookie', auth.cookies)
                .send({ categoryId: category.id, limit: 0 });
            expect(response.status).toBe(200);
        });
    });
});
