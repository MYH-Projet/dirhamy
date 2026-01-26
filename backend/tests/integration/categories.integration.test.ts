import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../helpers/request';
import { registerAndLogin } from '../helpers/authHelper';

describe('Categories Integration', () => {
    let auth: { user: any, cookies: string[] };

    beforeEach(async () => {
        auth = await registerAndLogin();
    });

    describe('POST /categories', () => {
        it('should create a category', async () => {
            const response = await api.post('/categories')
                .set('Cookie', auth.cookies)
                .send({ nom: 'Test Category', limit: 500 });

            expect(response.status).toBe(201);
            expect(response.body.nom).toBe('Test Category');
        });

        it('should fail if nom is missing', async () => {
            const response = await api.post('/categories')
                .set('Cookie', auth.cookies)
                .send({ limit: 500 });

            expect(response.status).toBe(400);
        });
    });

    describe('GET /categories', () => {
        it('should return user categories', async () => {
            await api.post('/categories')
                .set('Cookie', auth.cookies)
                .send({ nom: 'Cat 1' });

            const response = await api.get('/categories')
                .set('Cookie', auth.cookies);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body[0].nom).toBe('Cat 1');
        });

        it('should NOT return other users categories', async () => {
            // User A created a category in previous test, but DB is reset.
            // So we create one for A
            await api.post('/categories').set('Cookie', auth.cookies).send({ nom: 'User A Cat' });

            // Create User B
            const authB = await registerAndLogin();

            const response = await api.get('/categories').set('Cookie', authB.cookies);
            expect(response.status).toBe(200);
            expect(response.body.length).toBe(0);
        });
    });

    describe('PUT /categories/:id', () => {
        it('should update a category', async () => {
            const createRes = await api.post('/categories')
                .set('Cookie', auth.cookies)
                .send({ nom: 'Old Name' });
            const catId = createRes.body.id;

            const response = await api.put(`/categories/${catId}`)
                .set('Cookie', auth.cookies)
                .send({ nom: 'New Name' });

            expect(response.status).toBe(200);
            expect(response.body.nom).toBe('New Name');
        });

        it('should prevent updating other users category', async () => {
            const createRes = await api.post('/categories')
                .set('Cookie', auth.cookies)
                .send({ nom: 'User A Cat' });
            const catId = createRes.body.id;

            const authB = await registerAndLogin();
            const response = await api.put(`/categories/${catId}`)
                .set('Cookie', authB.cookies)
                .send({ nom: 'Hacked' });

            expect(response.status).toBeOneOf([403, 404]);
        });
        it('should return 400 for invalid update body', async () => {
            const createRes = await api.post('/categories')
                .set('Cookie', auth.cookies)
                .send({ nom: 'Valid Name' });
            const catId = createRes.body.id;

            const response = await api.put(`/categories/${catId}`)
                .set('Cookie', auth.cookies)
                .send({ nom: '' }); // Empty name

            // Validation should catch this
            expect(response.status).toBe(400);
        });

        it('should return 404 for updating non-existent category', async () => {
            const response = await api.put('/categories/999999')
                .set('Cookie', auth.cookies)
                .send({ nom: 'Ghost' });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /categories/:id', () => {
        it('should delete a category', async () => {
            const createRes = await api.post('/categories')
                .set('Cookie', auth.cookies)
                .send({ nom: 'To Delete' });
            const catId = createRes.body.id;

            const response = await api.delete(`/categories/${catId}`)
                .set('Cookie', auth.cookies);

            expect(response.status).toBe(200);

            // Verify DB
            const getRes = await api.get('/categories').set('Cookie', auth.cookies);
            expect(getRes.body.find((c: any) => c.id === catId)).toBeUndefined();
        });

        it('should prevent deleting other users category', async () => {
            const createRes = await api.post('/categories')
                .set('Cookie', auth.cookies)
                .send({ nom: 'User A Cat' });
            const catId = createRes.body.id;

            const authB = await registerAndLogin();
            const response = await api.delete(`/categories/${catId}`)
                .set('Cookie', authB.cookies);

            expect(response.status).toBeOneOf([403, 404]);
        });




    });
});
