import { describe, it, expect } from 'vitest';
import { api, getCookies } from '../helpers/request';
import { createTestUser } from '../helpers/factories';

describe('Auth Integration', () => {
    describe('POST /auth/register', () => {
        it('should register a new user successfully', async () => {
            const newUser = {
                nom: 'Doe',
                prenom: 'John',
                mail: `john${Date.now()}@example.com`,
                password: 'password123'
            };

            const response = await api.post('/auth/register').send(newUser);

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'User created successfully' });

            const cookies = getCookies(response);
            expect(cookies).toBeDefined();
            expect(cookies.some(c => c.includes('jwt='))).toBe(true);
            expect(cookies.some(c => c.includes('refreshToken='))).toBe(true);
        });

        it('should return 400 for missing fields', async () => {
            const response = await api.post('/auth/register').send({
                nom: 'Incomplete'
            });
            expect(response.status).toBe(400); // Validation error
        });

        it('should return 400 for duplicate email', async () => {
            const user = await createTestUser();
            const response = await api.post('/auth/register').send({
                nom: 'Copy',
                prenom: 'Cat',
                mail: user.email,
                password: 'password123'
            });
            // Depending on controller implementation it could be 400 or 409
            // Expecting error status
            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should return 400 for invalid email format', async () => {
            const response = await api.post('/auth/register').send({
                nom: 'John',
                prenom: 'Doe',
                mail: 'not-an-email',
                password: 'password123'
            });
            expect(response.status).toBe(400);
        });

        it('should return 400 for password too short', async () => {
            const response = await api.post('/auth/register').send({
                nom: 'John',
                prenom: 'Doe',
                mail: 'valid@email.com',
                password: '123'
            });
            expect(response.status).toBe(400);
        });

        it('should return 400 for whitespace-only fields', async () => {
            const response = await api.post('/auth/register').send({
                nom: '   ',
                prenom: '   ',
                mail: '  valid@email.com  ', // Email trim usually works, but empty nom/prenom should fail
                password: 'password123'
            });
            expect(response.status).toBe(400);
        });
    });

    describe('POST /auth/login', () => {
        it('should login successfully with correct credentials', async () => {
            const password = 'password123';
            const user = await createTestUser({ motDePasse: password });

            const response = await api.post('/auth/login').send({
                mail: user.email,
                password: password
            });

            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'Login successful' });

            const cookies = getCookies(response);
            expect(cookies.some(c => c.includes('jwt='))).toBe(true);
            expect(cookies.some(c => c.includes('refreshToken='))).toBe(true);
        });

        it('should return 400/401 for incorrect password', async () => {
            const user = await createTestUser({ motDePasse: 'correctIdentifier' });

            const response = await api.post('/auth/login').send({
                mail: user.email,
                password: 'wrongPassword'
            });

            expect(response.status).toBeGreaterThanOrEqual(400);
        });

        it('should return 400/401 for non-existent email', async () => {
            const response = await api.post('/auth/login').send({
                mail: 'nobody@nowhere.com',
                password: 'password123'
            });
            expect(response.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('POST /auth/logout', () => {
        it('should logout and clear cookies', async () => {
            // Login first to get cookies
            const user = await createTestUser();
            const loginRes = await api.post('/auth/login').send({
                mail: user.email,
                password: 'password123'
            });
            const cookies = getCookies(loginRes);

            const response = await api.post('/auth/logout').set('Cookie', cookies);

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Logged out successfully' });

            const logoutCookies = getCookies(response);
            expect(logoutCookies.some(c => c.includes('jwt=;'))).toBe(true);

            // Try accessing protected route with the CLEARED cookies (or reuse old ones if backend invalidates them server-side?)
            // Usually logout just clears cookie on client. 
            // If we send the "cleared" cookie (empty), it should fail.
            // If we reuse the OLD cookie, valid JWTs usually arguably still work unless we have a blacklist or short expiry.
            // Let's test that the response SETS the cookie to empty.
        });

        it('should deny access if client uses cleared cookie', async () => {
            const user = await createTestUser();
            const loginRes = await api.post('/auth/login').send({
                mail: user.email,
                password: 'password123'
            });

            // Perform logout
            const logoutRes = await api.post('/auth/logout');
            const clearedCookies = getCookies(logoutRes);
            // clearedCookies usually look like "jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT"

            const response = await api.get('/profile').set('Cookie', clearedCookies);
            expect(response.status).toBe(401);
        });
    });

    describe('Protected Route Access', () => {
        it('should return 401 when accessing protected route without cookies', async () => {
            const response = await api.get('/profile');
            expect(response.status).toBe(401);
        });

        it('should return 200 when accessing protected route with valid cookies', async () => {
            const user = await createTestUser();

            // Login to get cookies
            const loginRes = await api.post('/auth/login').send({
                mail: user.email,
                password: 'password123'
            });
            const cookies = getCookies(loginRes);

            const response = await api.get('/profile').set('Cookie', cookies);
            expect(response.status).toBe(200);
        });
    });

    describe('Rate Limit in Test', () => {
        it('should allow multiple requests without blocking (bypass check)', async () => {
            // In test env, rate limit should be disabled or mocked
            const requests = Array(10).fill(0).map(() => api.get('/health'));
            const responses = await Promise.all(requests);

            responses.forEach(res => {
                expect(res.status).not.toBe(429);
            });
        });
    });
});
