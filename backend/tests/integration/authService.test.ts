import { describe, it, expect } from 'vitest';
import * as authService from '../../src/services/authService';
import { createTestUser } from '../helpers/factories';
import bcrypt from 'bcryptjs';

describe('AuthService Integration', () => {
    it('should find user by email', async () => {
        const password = 'password123';
        const user = await createTestUser({ motDePasse: password });

        const foundUser = await authService.checkUserCredentials(user.email);
        expect(foundUser).toBeDefined();
        expect(foundUser.id).toBe(user.id);
        expect(foundUser.email).toBe(user.email);
    });

    it('should validate password correctly', async () => {
        const password = 'password123';
        const user = await createTestUser({ motDePasse: password });

        console.log('Test: Password input:', password);
        console.log('Test: Hash from DB:', user.motDePasse);

        const manualCompare = await bcrypt.compare(password, user.motDePasse);
        console.log('Test: Manual Compare Result:', manualCompare);

        try {
            await authService.checkPassword(user, password);
            console.log('Test: checkPassword passed');
        } catch (e: any) {
            console.log('Test: checkPassword FAILED:', e.message);
            throw e;
        }
    });
});
