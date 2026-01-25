import { describe, it, expect, vi } from 'vitest';
import { checkPassword } from '../../src/services/authService';
import bcrypt from 'bcryptjs';
import { AppError } from '../../src/utils/AppError';

describe('Auth Service Unit Tests', () => {
    describe('checkPassword', () => {
        it('should resolve if password is correct', async () => {
            const plainPassword = 'password123';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            const user: any = { motDePasse: hashedPassword };

            await expect(checkPassword(user, plainPassword)).resolves.toBeUndefined();
        });

        it('should throw AppError if password is incorrect', async () => {
            const plainPassword = 'password123';
            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            const user: any = { motDePasse: hashedPassword };

            await expect(checkPassword(user, 'wrong')).rejects.toThrow(AppError);
        });
    });
});
