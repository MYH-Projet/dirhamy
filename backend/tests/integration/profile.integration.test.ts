import { describe, it, expect, beforeEach } from 'vitest';
import { api } from '../helpers/request';
import { registerAndLogin } from '../helpers/authHelper';

describe('Profile Integration', () => {
    let auth: { user: any, cookies: string[] };

    beforeEach(async () => {
        auth = await registerAndLogin();
    });

    describe('GET /profile', () => {
        it('should return user profile and accounts', async () => {
            const response = await api.get('/profile')
                .set('Cookie', auth.cookies);

            expect(response.status).toBe(200);
            expect(response.body.user.email).toBe(auth.user.email);
            expect(Array.isArray(response.body.acconts)).toBe(true);
        });

        it('should return 401 if unauthenticated', async () => {
            const response = await api.get('/profile');
            expect(response.status).toBe(401);
        });
    });
});
